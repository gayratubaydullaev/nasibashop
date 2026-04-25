CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'NEW',
    'CONFIRMED',
    'PREPARING',
    'SHIPPED',
    'READY_FOR_PICKUP',
    'DELIVERED',
    'PICKED_UP',
    'CANCELLED'
  )),
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('DELIVERY', 'PICKUP')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('PAYME', 'CLICK', 'UZCARD', 'CASH_ON_DELIVERY')),
  subtotal_units BIGINT NOT NULL CHECK (subtotal_units >= 0),
  delivery_fee_units BIGINT NOT NULL CHECK (delivery_fee_units >= 0),
  discount_total_units BIGINT NOT NULL CHECK (discount_total_units >= 0),
  total_units BIGINT NOT NULL CHECK (total_units >= 0),
  currency_code TEXT NOT NULL,
  delivery_region TEXT,
  delivery_district TEXT,
  delivery_street TEXT,
  delivery_house TEXT,
  delivery_apartment TEXT,
  delivery_landmark TEXT,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  pickup_store_id TEXT,
  payment_id UUID,
  delivery_id UUID,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  variant_id UUID NOT NULL,
  sku TEXT NOT NULL,
  title_uz TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_units BIGINT NOT NULL CHECK (unit_price_units >= 0),
  total_price_units BIGINT NOT NULL CHECK (total_price_units >= 0),
  reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by TEXT,
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE saga_transactions (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL CHECK (step_type IN ('RESERVE_STOCK', 'CREATE_PAYMENT', 'CONFIRM_ORDER')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'COMPENSATED')),
  payload_json TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (order_id, step_type)
);

CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_store_created ON orders(store_id, created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id, changed_at DESC);
CREATE INDEX idx_saga_transactions_order_id ON saga_transactions(order_id);
