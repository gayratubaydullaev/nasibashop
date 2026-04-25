CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  amount_units BIGINT NOT NULL CHECK (amount_units >= 0),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  provider TEXT NOT NULL CHECK (provider IN ('PAYME', 'CLICK', 'UZCARD', 'CASH_ON_DELIVERY')),
  external_id TEXT,
  redirect_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount_units BIGINT NOT NULL CHECK (amount_units >= 0),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_store_created ON payments(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id, created_at DESC);
