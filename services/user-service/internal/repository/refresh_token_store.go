package repository

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type RefreshTokenStore struct {
	client *redis.Client
}

func NewRefreshTokenStore(client *redis.Client) *RefreshTokenStore {
	return &RefreshTokenStore{client: client}
}

func (s *RefreshTokenStore) Store(ctx context.Context, tokenHash string, userID string, ttl time.Duration) error {
	return s.client.Set(ctx, key(tokenHash), userID, ttl).Err()
}

func (s *RefreshTokenStore) GetUserID(ctx context.Context, tokenHash string) (string, error) {
	userID, err := s.client.Get(ctx, key(tokenHash)).Result()
	if err == redis.Nil {
		return "", ErrNotFound
	}
	return userID, err
}

func (s *RefreshTokenStore) Revoke(ctx context.Context, tokenHash string) error {
	return s.client.Del(ctx, key(tokenHash)).Err()
}

func key(tokenHash string) string {
	return "user-service:refresh-token:" + tokenHash
}
