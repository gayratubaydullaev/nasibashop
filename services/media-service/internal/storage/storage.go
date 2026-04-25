package storage

import (
	"context"
	"fmt"
	"strings"

	"github.com/nasibashop/nasibashop/services/media-service/internal/config"
)

type Store interface {
	Put(ctx context.Context, key string, data []byte, contentType string) error
	Get(ctx context.Context, key string) ([]byte, error)
	Delete(ctx context.Context, key string) error
}

func New(cfg config.Config) (Store, error) {
	if cfg.S3Endpoint != "" && cfg.S3Bucket != "" && cfg.S3AccessKey != "" && cfg.S3SecretKey != "" {
		return newS3(cfg)
	}
	return newLocal(cfg.MediaLocalDir)
}

func ObjectKey(id string) string {
	return fmt.Sprintf("media/%s/original", id)
}

func trimScheme(endpoint string) (host string, secure bool) {
	s := strings.TrimSpace(endpoint)
	switch {
	case strings.HasPrefix(s, "https://"):
		return strings.TrimPrefix(s, "https://"), true
	case strings.HasPrefix(s, "http://"):
		return strings.TrimPrefix(s, "http://"), false
	default:
		return s, true
	}
}
