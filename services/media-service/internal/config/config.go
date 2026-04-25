package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	HTTPPort        string
	DatabaseURL     string
	KafkaBrokers    []string
	MediaLocalDir   string
	S3Endpoint      string
	S3Bucket        string
	S3AccessKey     string
	S3SecretKey     string
	S3Region        string
	S3UsePathStyle  bool
	MaxUploadBytes  int64
	TopicUploaded   string
	TopicProcessed  string
}

func Load() Config {
	maxUp := int64(32 << 20) // 32 MiB
	if v := strings.TrimSpace(os.Getenv("MEDIA_MAX_UPLOAD_BYTES")); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			maxUp = n
		}
	}
	pathStyle := strings.EqualFold(os.Getenv("MEDIA_S3_USE_PATH_STYLE"), "true") ||
		strings.EqualFold(os.Getenv("MEDIA_S3_USE_PATH_STYLE"), "1")

	return Config{
		HTTPPort:       getEnv("HTTP_PORT", "8088"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://nasiba:nasiba_dev_password@localhost:5432/media_service?sslmode=disable"),
		KafkaBrokers:   splitCSV(getEnv("KAFKA_BROKERS", "localhost:9094")),
		MediaLocalDir:  getEnv("MEDIA_LOCAL_DIR", "./data/media"),
		S3Endpoint:     strings.TrimSpace(os.Getenv("MEDIA_S3_ENDPOINT")),
		S3Bucket:       strings.TrimSpace(os.Getenv("MEDIA_S3_BUCKET")),
		S3AccessKey:    strings.TrimSpace(os.Getenv("MEDIA_S3_ACCESS_KEY")),
		S3SecretKey:    strings.TrimSpace(os.Getenv("MEDIA_S3_SECRET_KEY")),
		S3Region:       getEnv("MEDIA_S3_REGION", "auto"),
		S3UsePathStyle: pathStyle,
		MaxUploadBytes: maxUp,
		TopicUploaded:  getEnv("KAFKA_TOPIC_MEDIA_UPLOADED", "media.uploaded"),
		TopicProcessed: getEnv("KAFKA_TOPIC_MEDIA_PROCESSED", "media.processed"),
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
