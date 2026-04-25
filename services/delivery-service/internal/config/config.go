package config

import (
	"os"
	"strings"
)

type Config struct {
	HTTPPort              string
	DatabaseURL           string
	KafkaBrokers          []string
	TopicOrderConfirmed   string
	TopicDeliveryCreated  string
	TopicDeliveryStatus   string
	DefaultFeeUnits       int64
}

func Load() Config {
	return Config{
		HTTPPort:             getEnv("HTTP_PORT", "8085"),
		DatabaseURL:          getEnv("DATABASE_URL", "postgres://nasiba:nasiba_dev_password@localhost:5432/delivery_service?sslmode=disable"),
		KafkaBrokers:         splitCSV(getEnv("KAFKA_BROKERS", "localhost:9094")),
		TopicOrderConfirmed:  getEnv("KAFKA_TOPIC_ORDER_CONFIRMED", "order.confirmed"),
		TopicDeliveryCreated: getEnv("KAFKA_TOPIC_DELIVERY_CREATED", "delivery.created"),
		TopicDeliveryStatus: getEnv("KAFKA_TOPIC_DELIVERY_STATUS_CHANGED", "delivery.status.changed"),
		DefaultFeeUnits:      15000,
	}
}

func getEnv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
