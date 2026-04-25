package storage

import (
	"bytes"
	"context"
	"io"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/nasibashop/nasibashop/services/media-service/internal/config"
)

type s3Store struct {
	client *minio.Client
	bucket string
}

func newS3(cfg config.Config) (*s3Store, error) {
	host, secure := trimScheme(cfg.S3Endpoint)
	opts := &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.S3AccessKey, cfg.S3SecretKey, ""),
		Secure: secure,
		Region: cfg.S3Region,
	}
	if cfg.S3UsePathStyle {
		opts.BucketLookup = minio.BucketLookupPath
	}
	cli, err := minio.New(host, opts)
	if err != nil {
		return nil, err
	}
	return &s3Store{client: cli, bucket: cfg.S3Bucket}, nil
}

func (s *s3Store) Put(ctx context.Context, key string, data []byte, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucket, key, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	return err
}

func (s *s3Store) Get(ctx context.Context, key string) ([]byte, error) {
	obj, err := s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, err
	}
	defer obj.Close()
	return io.ReadAll(obj)
}

func (s *s3Store) Delete(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}
