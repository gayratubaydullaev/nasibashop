-- media_service database

CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY,
    content_type TEXT NOT NULL,
    original_filename TEXT,
    size_bytes BIGINT NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    width INT,
    height INT,
    blurhash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
