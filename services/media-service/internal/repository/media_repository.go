package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("not found")

type MediaRow struct {
	ID               string
	ContentType      string
	OriginalFilename string
	SizeBytes        int64
	StorageKey       string
	Width            int
	Height           int
	Blurhash         string
}

type Repository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Insert(ctx context.Context, row MediaRow) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO media_assets (id, content_type, original_filename, size_bytes, storage_key, width, height, blurhash)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		row.ID, row.ContentType, row.OriginalFilename, row.SizeBytes, row.StorageKey,
		nullInt(row.Width), nullInt(row.Height), nullString(row.Blurhash),
	)
	return err
}

func nullInt(v int) any {
	if v <= 0 {
		return nil
	}
	return v
}

func nullString(s string) any {
	if s == "" {
		return nil
	}
	return s
}

func (r *Repository) GetByID(ctx context.Context, id string) (MediaRow, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id::text, content_type, COALESCE(original_filename,''), size_bytes, storage_key,
		       COALESCE(width,0), COALESCE(height,0), COALESCE(blurhash,'')
		FROM media_assets WHERE id = $1`, id)
	var m MediaRow
	if err := row.Scan(&m.ID, &m.ContentType, &m.OriginalFilename, &m.SizeBytes, &m.StorageKey, &m.Width, &m.Height, &m.Blurhash); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return MediaRow{}, ErrNotFound
		}
		return MediaRow{}, err
	}
	return m, nil
}

func (r *Repository) Delete(ctx context.Context, id string) (MediaRow, error) {
	m, err := r.GetByID(ctx, id)
	if err != nil {
		return MediaRow{}, err
	}
	_, err = r.pool.Exec(ctx, `DELETE FROM media_assets WHERE id = $1`, id)
	if err != nil {
		return MediaRow{}, err
	}
	return m, nil
}

func NewUUID() string {
	return uuid.NewString()
}
