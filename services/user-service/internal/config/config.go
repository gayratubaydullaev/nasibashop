package config

import (
	"crypto/rand"
	"crypto/rsa"
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Config struct {
	HTTPPort     string
	DatabaseURL  string
	RedisAddr    string
	KafkaBrokers []string
	Auth         AuthConfig
	JWT          JWTConfig
}

type AuthConfig struct {
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
}

type JWTConfig struct {
	Issuer     string
	PrivateKey *rsa.PrivateKey
	PublicKey  *rsa.PublicKey
}

func Load() (Config, error) {
	privateKey, publicKey, err := loadKeys()
	if err != nil {
		return Config{}, err
	}

	return Config{
		HTTPPort:     getEnv("HTTP_PORT", "8080"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://nasiba:nasiba_dev_password@localhost:5432/user_service?sslmode=disable"),
		RedisAddr:    getEnv("REDIS_ADDR", "localhost:6379"),
		KafkaBrokers: splitCSV(getEnv("KAFKA_BROKERS", "localhost:9094")),
		Auth: AuthConfig{
			AccessTokenTTL:  getDurationEnv("ACCESS_TOKEN_TTL", 15*time.Minute),
			RefreshTokenTTL: getDurationEnv("REFRESH_TOKEN_TTL", 7*24*time.Hour),
		},
		JWT: JWTConfig{
			Issuer:     getEnv("JWT_ISSUER", "nasibashop-user-service"),
			PrivateKey: privateKey,
			PublicKey:  publicKey,
		},
	}, nil
}

func readPEMOrFile(envVal, fileEnv string) string {
	if v := strings.TrimSpace(envVal); v != "" {
		return v
	}
	p := strings.TrimSpace(fileEnv)
	if p == "" {
		return ""
	}
	p = filepath.Clean(p)
	b, err := os.ReadFile(p)
	if err != nil {
		return ""
	}
	return string(b)
}

func loadKeys() (*rsa.PrivateKey, *rsa.PublicKey, error) {
	privatePEM := readPEMOrFile(os.Getenv("JWT_PRIVATE_KEY"), os.Getenv("JWT_PRIVATE_KEY_FILE"))
	publicPEM := readPEMOrFile(os.Getenv("JWT_PUBLIC_KEY"), os.Getenv("JWT_PUBLIC_KEY_FILE"))
	if privatePEM == "" || publicPEM == "" {
		privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
		if err != nil {
			return nil, nil, err
		}
		return privateKey, &privateKey.PublicKey, nil
	}

	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM([]byte(privatePEM))
	if err != nil {
		return nil, nil, errors.New("invalid JWT_PRIVATE_KEY")
	}

	publicKey, err := jwt.ParseRSAPublicKeyFromPEM([]byte(publicPEM))
	if err != nil {
		return nil, nil, errors.New("invalid JWT_PUBLIC_KEY")
	}

	return privateKey, publicKey, nil
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	seconds, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return time.Duration(seconds) * time.Second
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}
