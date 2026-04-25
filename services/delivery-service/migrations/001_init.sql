-- delivery_service database (apply manually or via CI)

CREATE TABLE IF NOT EXISTS store_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address_line TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    working_hours JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_locations_store_id ON store_locations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_locations_active ON store_locations(active) WHERE active = true;

CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    center_latitude DOUBLE PRECISION NOT NULL,
    center_longitude DOUBLE PRECISION NOT NULL,
    radius_km DOUBLE PRECISION NOT NULL DEFAULT 5,
    base_fee_units BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_store_location ON delivery_zones(store_location_id);

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    fulfillment_type TEXT NOT NULL,
    status TEXT NOT NULL,
    fee_units BIGINT NOT NULL DEFAULT 0,
    currency_code TEXT NOT NULL DEFAULT 'UZS',
    pickup_store_id TEXT,
    delivery_region TEXT,
    delivery_district TEXT,
    delivery_street TEXT,
    delivery_house TEXT,
    delivery_apartment TEXT,
    delivery_landmark TEXT,
    delivery_latitude DOUBLE PRECISION,
    delivery_longitude DOUBLE PRECISION,
    assigned_store_location_id UUID REFERENCES store_locations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_store_id ON deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

CREATE TABLE IF NOT EXISTS delivery_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    note TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery_id ON delivery_tracking(delivery_id);

-- Demo pickup point (Tashkent); safe to run repeatedly
INSERT INTO store_locations (store_id, name, address_line, latitude, longitude, active)
SELECT 'demo-store', 'Demo pickup', 'Chilonzor', 41.2855, 69.2035, true
WHERE NOT EXISTS (SELECT 1 FROM store_locations WHERE store_id = 'demo-store' LIMIT 1);

INSERT INTO delivery_zones (store_location_id, name, center_latitude, center_longitude, radius_km, base_fee_units)
SELECT sl.id, 'Center Tashkent', 41.3111, 69.2797, 12, 25000
FROM store_locations sl
WHERE sl.store_id = 'demo-store'
  AND NOT EXISTS (SELECT 1 FROM delivery_zones dz WHERE dz.store_location_id = sl.id LIMIT 1);
