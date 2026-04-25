CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name_uz TEXT NOT NULL,
  description_uz TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  store_id TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  title_uz TEXT NOT NULL,
  description_uz TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  price_units BIGINT NOT NULL CHECK (price_units >= 0),
  currency_code TEXT NOT NULL DEFAULT 'UZS',
  discount_percent INT NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  price_override_units BIGINT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_id TEXT,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_locations (
  id UUID PRIMARY KEY,
  store_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  opening_hours TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (variant_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_product_id ON stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_store_id ON stocks(store_id);
