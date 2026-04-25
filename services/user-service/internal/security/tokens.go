package security

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/nasibashop/nasibashop/services/user-service/internal/config"
	"github.com/nasibashop/nasibashop/services/user-service/internal/domain"
)

type TokenManager struct {
	issuer     string
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
}

type jwtClaims struct {
	Roles []domain.Role `json:"roles"`
	Phone string        `json:"phone,omitempty"`
	Email string        `json:"email,omitempty"`
	jwt.RegisteredClaims
}

func NewTokenManager(cfg config.JWTConfig) (*TokenManager, error) {
	if cfg.PrivateKey == nil || cfg.PublicKey == nil {
		return nil, errors.New("jwt keys are required")
	}
	return &TokenManager{
		issuer:     cfg.Issuer,
		privateKey: cfg.PrivateKey,
		publicKey:  cfg.PublicKey,
	}, nil
}

func (m *TokenManager) CreateAccessToken(user domain.User, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := jwtClaims{
		Roles: user.Roles,
		Phone: user.Phone,
		Email: user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    m.issuer,
			Subject:   user.ID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	return token.SignedString(m.privateKey)
}

func (m *TokenManager) ValidateAccessToken(tokenValue string) (domain.Claims, error) {
	claims := &jwtClaims{}
	token, err := jwt.ParseWithClaims(tokenValue, claims, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodRS256 {
			return nil, errors.New("unexpected jwt signing method")
		}
		return m.publicKey, nil
	}, jwt.WithIssuer(m.issuer))
	if err != nil {
		return domain.Claims{}, err
	}
	if !token.Valid {
		return domain.Claims{}, errors.New("invalid token")
	}

	expiresAt := int64(0)
	if claims.ExpiresAt != nil {
		expiresAt = claims.ExpiresAt.Unix()
	}

	return domain.Claims{
		UserID:    claims.Subject,
		Phone:     claims.Phone,
		Email:     claims.Email,
		Roles:     claims.Roles,
		ExpiresAt: expiresAt,
	}, nil
}

func NewRefreshToken() (string, string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}

	token := base64.RawURLEncoding.EncodeToString(raw)
	return token, HashToken(token), nil
}

func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}
