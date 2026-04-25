package storage

import (
	"context"
	"os"
	"path/filepath"
)

type localStore struct {
	base string
}

func newLocal(base string) (*localStore, error) {
	if err := os.MkdirAll(base, 0o755); err != nil {
		return nil, err
	}
	return &localStore{base: base}, nil
}

func (l *localStore) path(key string) string {
	return filepath.Join(l.base, filepath.FromSlash(key))
}

func (l *localStore) Put(_ context.Context, key string, data []byte, _ string) error {
	full := l.path(key)
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return err
	}
	return os.WriteFile(full, data, 0o644)
}

func (l *localStore) Get(_ context.Context, key string) ([]byte, error) {
	return os.ReadFile(l.path(key))
}

func (l *localStore) Delete(_ context.Context, key string) error {
	return os.Remove(l.path(key))
}
