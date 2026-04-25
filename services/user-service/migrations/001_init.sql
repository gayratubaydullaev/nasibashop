CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'STORE_MANAGER', 'CUSTOMER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  street TEXT NOT NULL,
  house TEXT NOT NULL,
  apartment TEXT,
  landmark TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT,
  user_agent TEXT,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sms_codes (
  id UUID PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone_active ON sms_codes(phone, expires_at) WHERE consumed_at IS NULL;
