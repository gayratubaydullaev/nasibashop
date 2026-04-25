package config

import (
	"os"
	"strings"
)

type Config struct {
	HTTPPort     string
	DatabaseURL  string
	KafkaBrokers []string
}

func Load() (Config, error) {
	return Config{
		HTTPPort:     getEnv("HTTP_PORT", "8083"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://nasiba:nasiba_dev_password@localhost:5432/product_service?sslmode=disable"),
		KafkaBrokers: splitCSV(getEnv("KAFKA_BROKERS", "localhost:9094")),
	}, nil
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
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
