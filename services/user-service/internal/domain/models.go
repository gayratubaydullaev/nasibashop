package domain

import "time"

type Role string

const (
	RoleSuperAdmin   Role = "SUPER_ADMIN"
	RoleStoreManager Role = "STORE_MANAGER"
	RoleCustomer     Role = "CUSTOMER"
)

type User struct {
	ID            string    `json:"id"`
	Phone         string    `json:"phone,omitempty"`
	Email         string    `json:"email,omitempty"`
	PasswordHash  string    `json:"-"`
	FullName      string    `json:"fullName"`
	AvatarURL     string    `json:"avatarUrl,omitempty"`
	Roles         []Role    `json:"roles"`
	PhoneVerified bool      `json:"phoneVerified"`
	EmailVerified bool      `json:"emailVerified"`
	IsActive      bool      `json:"isActive"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type Address struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Label     string    `json:"label"`
	Region    string    `json:"region"`
	District  string    `json:"district"`
	Street    string    `json:"street"`
	House     string    `json:"house"`
	Apartment string    `json:"apartment,omitempty"`
	Landmark  string    `json:"landmark,omitempty"`
	Latitude  float64   `json:"latitude,omitempty"`
	Longitude float64   `json:"longitude,omitempty"`
	IsDefault bool      `json:"isDefault"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Tokens struct {
	AccessToken             string `json:"accessToken"`
	RefreshToken            string `json:"refreshToken"`
	AccessExpiresInSeconds  int64  `json:"accessExpiresInSeconds"`
	RefreshExpiresInSeconds int64  `json:"refreshExpiresInSeconds"`
	TokenType               string `json:"tokenType"`
}

type Claims struct {
	UserID    string   `json:"userId"`
	Phone     string   `json:"phone,omitempty"`
	Email     string   `json:"email,omitempty"`
	Roles     []Role   `json:"roles"`
	ExpiresAt int64    `json:"expiresAt"`
}

type RegisterInput struct {
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
}

type AuthenticateInput struct {
	Phone     string `json:"phone"`
	SMSCode   string `json:"smsCode"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	DeviceID  string `json:"deviceId"`
	UserAgent string `json:"userAgent"`
	IPAddress string `json:"ipAddress"`
}

type UpdateProfileInput struct {
	FullName  string `json:"fullName"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	AvatarURL string `json:"avatarUrl"`
}
