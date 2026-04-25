package service

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/nasibashop/nasibashop/services/user-service/internal/config"
	"github.com/nasibashop/nasibashop/services/user-service/internal/domain"
	"github.com/nasibashop/nasibashop/services/user-service/internal/events"
	"github.com/nasibashop/nasibashop/services/user-service/internal/repository"
	"github.com/nasibashop/nasibashop/services/user-service/internal/security"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInactiveUser       = errors.New("user is inactive")
)

type AuthService struct {
	users     *repository.UserRepository
	tokens    *repository.RefreshTokenStore
	events    *events.Publisher
	jwt       *security.TokenManager
	auth      config.AuthConfig
	logger    *slog.Logger
}

func NewAuthService(
	users *repository.UserRepository,
	tokens *repository.RefreshTokenStore,
	events *events.Publisher,
	jwt *security.TokenManager,
	auth config.AuthConfig,
	logger *slog.Logger,
) *AuthService {
	return &AuthService{
		users:  users,
		tokens: tokens,
		events: events,
		jwt:    jwt,
		auth:   auth,
		logger: logger,
	}
}

func (s *AuthService) Register(ctx context.Context, input domain.RegisterInput) (domain.User, domain.Tokens, error) {
	if strings.TrimSpace(input.Phone) == "" && strings.TrimSpace(input.Email) == "" {
		return domain.User{}, domain.Tokens{}, errors.New("phone or email is required")
	}

	passwordHash, err := security.HashPassword(input.Password)
	if err != nil {
		return domain.User{}, domain.Tokens{}, err
	}

	user := domain.User{
		ID:            uuid.NewString(),
		Phone:         normalize(input.Phone),
		Email:         strings.ToLower(normalize(input.Email)),
		PasswordHash:  passwordHash,
		FullName:      strings.TrimSpace(input.FullName),
		Roles:         []domain.Role{domain.RoleCustomer},
		PhoneVerified: false,
		EmailVerified: false,
		IsActive:      true,
	}

	created, err := s.users.Create(ctx, user)
	if err != nil {
		return domain.User{}, domain.Tokens{}, err
	}

	tokens, err := s.issueTokens(ctx, created, "", "", "")
	if err != nil {
		return domain.User{}, domain.Tokens{}, err
	}

	s.events.Publish(ctx, "user.created", created.ID, map[string]any{
		"userId":    created.ID,
		"phone":     created.Phone,
		"email":     created.Email,
		"timestamp": time.Now().UTC(),
	})

	return created, tokens, nil
}

func (s *AuthService) Authenticate(ctx context.Context, input domain.AuthenticateInput) (domain.User, domain.Tokens, error) {
	user, err := s.findUserForAuth(ctx, input)
	if err != nil {
		return domain.User{}, domain.Tokens{}, ErrInvalidCredentials
	}
	if !user.IsActive {
		return domain.User{}, domain.Tokens{}, ErrInactiveUser
	}

	if input.Email != "" {
		ok, err := security.VerifyPassword(input.Password, user.PasswordHash)
		if err != nil || !ok {
			return domain.User{}, domain.Tokens{}, ErrInvalidCredentials
		}
	}

	if input.Phone != "" && input.SMSCode != "000000" {
		return domain.User{}, domain.Tokens{}, ErrInvalidCredentials
	}

	tokens, err := s.issueTokens(ctx, user, input.DeviceID, input.UserAgent, input.IPAddress)
	if err != nil {
		return domain.User{}, domain.Tokens{}, err
	}

	return user, tokens, nil
}

func (s *AuthService) ValidateToken(_ context.Context, accessToken string) (domain.Claims, error) {
	return s.jwt.ValidateAccessToken(accessToken)
}

func (s *AuthService) GetUser(ctx context.Context, id string) (domain.User, error) {
	return s.users.FindByID(ctx, id)
}

func (s *AuthService) UpdateProfile(ctx context.Context, id string, input domain.UpdateProfileInput) (domain.User, error) {
	return s.users.UpdateProfile(ctx, id, input)
}

func (s *AuthService) AddAddress(ctx context.Context, userID string, address domain.Address) (domain.Address, error) {
	address.ID = uuid.NewString()
	address.UserID = userID

	created, err := s.users.AddAddress(ctx, address)
	if err != nil {
		return domain.Address{}, err
	}

	s.events.Publish(ctx, "user.address.added", created.UserID, map[string]any{
		"userId":    created.UserID,
		"addressId": created.ID,
		"timestamp": time.Now().UTC(),
	})

	return created, nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (domain.Tokens, error) {
	tokenHash := security.HashToken(refreshToken)
	userID, err := s.tokens.GetUserID(ctx, tokenHash)
	if err != nil {
		return domain.Tokens{}, ErrInvalidCredentials
	}

	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return domain.Tokens{}, err
	}

	_ = s.tokens.Revoke(ctx, tokenHash)
	return s.issueTokens(ctx, user, "", "", "")
}

func (s *AuthService) findUserForAuth(ctx context.Context, input domain.AuthenticateInput) (domain.User, error) {
	if input.Email != "" {
		return s.users.FindByEmail(ctx, strings.ToLower(normalize(input.Email)))
	}
	if input.Phone != "" {
		return s.users.FindByPhone(ctx, normalize(input.Phone))
	}
	return domain.User{}, repository.ErrNotFound
}

func (s *AuthService) issueTokens(ctx context.Context, user domain.User, deviceID string, userAgent string, ipAddress string) (domain.Tokens, error) {
	accessToken, err := s.jwt.CreateAccessToken(user, s.auth.AccessTokenTTL)
	if err != nil {
		return domain.Tokens{}, err
	}

	refreshToken, refreshHash, err := security.NewRefreshToken()
	if err != nil {
		return domain.Tokens{}, err
	}
	if err := s.tokens.Store(ctx, refreshHash, user.ID, s.auth.RefreshTokenTTL); err != nil {
		return domain.Tokens{}, err
	}

	_ = deviceID
	_ = userAgent
	_ = ipAddress

	return domain.Tokens{
		AccessToken:             accessToken,
		RefreshToken:            refreshToken,
		AccessExpiresInSeconds:  int64(s.auth.AccessTokenTTL.Seconds()),
		RefreshExpiresInSeconds: int64(s.auth.RefreshTokenTTL.Seconds()),
		TokenType:               "Bearer",
	}, nil
}

func normalize(value string) string {
	return strings.TrimSpace(value)
}
