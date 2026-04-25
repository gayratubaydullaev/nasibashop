package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/nasibashop/nasibashop/services/user-service/internal/domain"
)

var ErrNotFound = errors.New("not found")

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user domain.User) (domain.User, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.User{}, err
	}
	defer tx.Rollback(ctx)

	const query = `
		INSERT INTO users (id, phone, email, password_hash, full_name, avatar_url, phone_verified, email_verified, is_active)
		VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5, NULLIF($6, ''), $7, $8, $9)
		RETURNING id, COALESCE(phone, ''), COALESCE(email, ''), password_hash, full_name, COALESCE(avatar_url, ''),
			phone_verified, email_verified, is_active, created_at, updated_at`

	created, err := scanUser(tx.QueryRow(ctx, query,
		user.ID,
		user.Phone,
		user.Email,
		user.PasswordHash,
		user.FullName,
		user.AvatarURL,
		user.PhoneVerified,
		user.EmailVerified,
		user.IsActive,
	))
	if err != nil {
		return domain.User{}, err
	}

	roles := user.Roles
	if len(roles) == 0 {
		roles = []domain.Role{domain.RoleCustomer}
	}
	for _, role := range roles {
		if _, err := tx.Exec(ctx, `INSERT INTO roles (user_id, role) VALUES ($1, $2)`, created.ID, role); err != nil {
			return domain.User{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.User{}, err
	}

	created.Roles = roles
	return created, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (domain.User, error) {
	const query = `
		SELECT id, COALESCE(phone, ''), COALESCE(email, ''), password_hash, full_name, COALESCE(avatar_url, ''),
			phone_verified, email_verified, is_active, created_at, updated_at
		FROM users
		WHERE id = $1`

	user, err := scanUser(r.db.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.User{}, ErrNotFound
	}
	if err != nil {
		return domain.User{}, err
	}

	user.Roles, err = r.findRoles(ctx, user.ID)
	return user, err
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (domain.User, error) {
	return r.findByIdentity(ctx, "email", email)
}

func (r *UserRepository) FindByPhone(ctx context.Context, phone string) (domain.User, error) {
	return r.findByIdentity(ctx, "phone", phone)
}

func (r *UserRepository) UpdateProfile(ctx context.Context, id string, input domain.UpdateProfileInput) (domain.User, error) {
	const query = `
		UPDATE users
		SET full_name = COALESCE(NULLIF($2, ''), full_name),
			email = COALESCE(NULLIF($3, ''), email),
			phone = COALESCE(NULLIF($4, ''), phone),
			avatar_url = COALESCE(NULLIF($5, ''), avatar_url),
			updated_at = now()
		WHERE id = $1
		RETURNING id, COALESCE(phone, ''), COALESCE(email, ''), password_hash, full_name, COALESCE(avatar_url, ''),
			phone_verified, email_verified, is_active, created_at, updated_at`

	user, err := scanUser(r.db.QueryRow(ctx, query, id, input.FullName, input.Email, input.Phone, input.AvatarURL))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.User{}, ErrNotFound
	}
	if err != nil {
		return domain.User{}, err
	}

	user.Roles, err = r.findRoles(ctx, user.ID)
	return user, err
}

func (r *UserRepository) AddAddress(ctx context.Context, address domain.Address) (domain.Address, error) {
	const query = `
		INSERT INTO addresses (id, user_id, label, region, district, street, house, apartment, landmark, latitude, longitude, is_default)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, ''), NULLIF($9, ''), $10, $11, $12)
		RETURNING id, user_id, label, region, district, street, house, COALESCE(apartment, ''), COALESCE(landmark, ''),
			COALESCE(latitude, 0), COALESCE(longitude, 0), is_default, created_at, updated_at`

	return scanAddress(r.db.QueryRow(ctx, query,
		address.ID,
		address.UserID,
		address.Label,
		address.Region,
		address.District,
		address.Street,
		address.House,
		address.Apartment,
		address.Landmark,
		address.Latitude,
		address.Longitude,
		address.IsDefault,
	))
}

func (r *UserRepository) findByIdentity(ctx context.Context, column string, value string) (domain.User, error) {
	query := `
		SELECT id, COALESCE(phone, ''), COALESCE(email, ''), password_hash, full_name, COALESCE(avatar_url, ''),
			phone_verified, email_verified, is_active, created_at, updated_at
		FROM users
		WHERE ` + column + ` = $1`

	user, err := scanUser(r.db.QueryRow(ctx, query, value))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.User{}, ErrNotFound
	}
	if err != nil {
		return domain.User{}, err
	}

	user.Roles, err = r.findRoles(ctx, user.ID)
	return user, err
}

func (r *UserRepository) findRoles(ctx context.Context, userID string) ([]domain.Role, error) {
	rows, err := r.db.Query(ctx, `SELECT role FROM roles WHERE user_id = $1 ORDER BY role`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := make([]domain.Role, 0)
	for rows.Next() {
		var role domain.Role
		if err := rows.Scan(&role); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanUser(row rowScanner) (domain.User, error) {
	var user domain.User
	err := row.Scan(
		&user.ID,
		&user.Phone,
		&user.Email,
		&user.PasswordHash,
		&user.FullName,
		&user.AvatarURL,
		&user.PhoneVerified,
		&user.EmailVerified,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	return user, err
}

func scanAddress(row rowScanner) (domain.Address, error) {
	var address domain.Address
	err := row.Scan(
		&address.ID,
		&address.UserID,
		&address.Label,
		&address.Region,
		&address.District,
		&address.Street,
		&address.House,
		&address.Apartment,
		&address.Landmark,
		&address.Latitude,
		&address.Longitude,
		&address.IsDefault,
		&address.CreatedAt,
		&address.UpdatedAt,
	)
	return address, err
}
