package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/nasibashop/nasibashop/services/delivery-service/internal/domain"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/geo"
)

var ErrNotFound = errors.New("not found")

type Repository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListActiveStores(ctx context.Context) ([]domain.StoreLocation, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, store_id, name, COALESCE(address_line,''), latitude, longitude, COALESCE(working_hours::text,'{}'), active, created_at, updated_at
		FROM store_locations WHERE active = true ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.StoreLocation
	for rows.Next() {
		var s domain.StoreLocation
		var whJSON string
		if err := rows.Scan(&s.ID, &s.StoreID, &s.Name, &s.AddressLine, &s.Latitude, &s.Longitude, &whJSON, &s.Active, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(whJSON), &s.WorkingHours)
		if s.WorkingHours == nil {
			s.WorkingHours = map[string]any{}
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *Repository) CreateStore(ctx context.Context, storeID, name, address string, lat, lng float64) (domain.StoreLocation, error) {
	id := uuid.NewString()
	row := r.pool.QueryRow(ctx, `
		INSERT INTO store_locations (id, store_id, name, address_line, latitude, longitude, active)
		VALUES ($1,$2,$3,$4,$5,$6,true)
		RETURNING id, store_id, name, COALESCE(address_line,''), latitude, longitude, COALESCE(working_hours::text,'{}'), active, created_at, updated_at`,
		id, storeID, name, address, lat, lng)
	var s domain.StoreLocation
	var whJSON string
	if err := row.Scan(&s.ID, &s.StoreID, &s.Name, &s.AddressLine, &s.Latitude, &s.Longitude, &whJSON, &s.Active, &s.CreatedAt, &s.UpdatedAt); err != nil {
		return domain.StoreLocation{}, err
	}
	_ = json.Unmarshal([]byte(whJSON), &s.WorkingHours)
	if s.WorkingHours == nil {
		s.WorkingHours = map[string]any{}
	}
	return s, nil
}

func (r *Repository) ListZonesForStoreLocation(ctx context.Context, storeLocationID string) ([]domain.DeliveryZone, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, store_location_id, name, center_latitude, center_longitude, radius_km, base_fee_units
		FROM delivery_zones WHERE store_location_id = $1`, storeLocationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.DeliveryZone
	for rows.Next() {
		var z domain.DeliveryZone
		if err := rows.Scan(&z.ID, &z.StoreLocationID, &z.Name, &z.CenterLatitude, &z.CenterLongitude, &z.RadiusKm, &z.BaseFeeUnits); err != nil {
			return nil, err
		}
		out = append(out, z)
	}
	return out, rows.Err()
}

func (r *Repository) InsertZone(ctx context.Context, storeLocationID, name string, clat, clng, radiusKm float64, feeUnits int64) (domain.DeliveryZone, error) {
	id := uuid.NewString()
	row := r.pool.QueryRow(ctx, `
		INSERT INTO delivery_zones (id, store_location_id, name, center_latitude, center_longitude, radius_km, base_fee_units)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, store_location_id, name, center_latitude, center_longitude, radius_km, base_fee_units`,
		id, storeLocationID, name, clat, clng, radiusKm, feeUnits)
	var z domain.DeliveryZone
	if err := row.Scan(&z.ID, &z.StoreLocationID, &z.Name, &z.CenterLatitude, &z.CenterLongitude, &z.RadiusKm, &z.BaseFeeUnits); err != nil {
		return domain.DeliveryZone{}, err
	}
	return z, nil
}

func (r *Repository) GetStoreLocationByBusinessStoreID(ctx context.Context, businessStoreID string) (domain.StoreLocation, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, store_id, name, COALESCE(address_line,''), latitude, longitude, COALESCE(working_hours::text,'{}'), active, created_at, updated_at
		FROM store_locations WHERE store_id = $1 AND active = true ORDER BY created_at ASC LIMIT 1`, businessStoreID)
	var s domain.StoreLocation
	var whJSON string
	if err := row.Scan(&s.ID, &s.StoreID, &s.Name, &s.AddressLine, &s.Latitude, &s.Longitude, &whJSON, &s.Active, &s.CreatedAt, &s.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.StoreLocation{}, ErrNotFound
		}
		return domain.StoreLocation{}, err
	}
	_ = json.Unmarshal([]byte(whJSON), &s.WorkingHours)
	if s.WorkingHours == nil {
		s.WorkingHours = map[string]any{}
	}
	return s, nil
}

func (r *Repository) GetStoreByID(ctx context.Context, id string) (domain.StoreLocation, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, store_id, name, COALESCE(address_line,''), latitude, longitude, COALESCE(working_hours::text,'{}'), active, created_at, updated_at
		FROM store_locations WHERE id = $1`, id)
	var s domain.StoreLocation
	var whJSON string
	if err := row.Scan(&s.ID, &s.StoreID, &s.Name, &s.AddressLine, &s.Latitude, &s.Longitude, &whJSON, &s.Active, &s.CreatedAt, &s.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.StoreLocation{}, ErrNotFound
		}
		return domain.StoreLocation{}, err
	}
	_ = json.Unmarshal([]byte(whJSON), &s.WorkingHours)
	if s.WorkingHours == nil {
		s.WorkingHours = map[string]any{}
	}
	return s, nil
}

func (r *Repository) GetDeliveryByOrderID(ctx context.Context, orderID string) (domain.Delivery, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, order_id, user_id, store_id, fulfillment_type, status, fee_units, currency_code,
		       COALESCE(pickup_store_id,''), COALESCE(delivery_region,''), COALESCE(delivery_district,''),
		       COALESCE(delivery_street,''), COALESCE(delivery_house,''), COALESCE(delivery_apartment,''),
		       COALESCE(delivery_landmark,''), delivery_latitude, delivery_longitude,
		       COALESCE(assigned_store_location_id::text,''), created_at, updated_at
		FROM deliveries WHERE order_id = $1`, orderID)
	return scanDelivery(row)
}

func (r *Repository) GetDeliveryByID(ctx context.Context, id string) (domain.Delivery, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, order_id, user_id, store_id, fulfillment_type, status, fee_units, currency_code,
		       COALESCE(pickup_store_id,''), COALESCE(delivery_region,''), COALESCE(delivery_district,''),
		       COALESCE(delivery_street,''), COALESCE(delivery_house,''), COALESCE(delivery_apartment,''),
		       COALESCE(delivery_landmark,''), delivery_latitude, delivery_longitude,
		       COALESCE(assigned_store_location_id::text,''), created_at, updated_at
		FROM deliveries WHERE id = $1`, id)
	return scanDelivery(row)
}

func scanDelivery(row pgx.Row) (domain.Delivery, error) {
	var d domain.Delivery
	var lat, lng *float64
	var assigned string
	if err := row.Scan(&d.ID, &d.OrderID, &d.UserID, &d.StoreID, &d.FulfillmentType, &d.Status, &d.FeeUnits, &d.CurrencyCode,
		&d.PickupStoreID, &d.DeliveryRegion, &d.DeliveryDistrict, &d.DeliveryStreet, &d.DeliveryHouse, &d.DeliveryApartment,
		&d.DeliveryLandmark, &lat, &lng, &assigned, &d.CreatedAt, &d.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Delivery{}, ErrNotFound
		}
		return domain.Delivery{}, err
	}
	d.DeliveryLatitude = lat
	d.DeliveryLongitude = lng
	d.AssignedStoreLocationID = assigned
	return d, nil
}

func (r *Repository) InsertDelivery(ctx context.Context, d domain.Delivery) (domain.Delivery, error) {
	if d.ID == "" {
		d.ID = uuid.NewString()
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO deliveries (
			id, order_id, user_id, store_id, fulfillment_type, status, fee_units, currency_code,
			pickup_store_id, delivery_region, delivery_district, delivery_street, delivery_house,
			delivery_apartment, delivery_landmark, delivery_latitude, delivery_longitude, assigned_store_location_id
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
		d.ID, d.OrderID, d.UserID, d.StoreID, d.FulfillmentType, d.Status, d.FeeUnits, d.CurrencyCode,
		nullIfEmpty(d.PickupStoreID), nullIfEmpty(d.DeliveryRegion), nullIfEmpty(d.DeliveryDistrict),
		nullIfEmpty(d.DeliveryStreet), nullIfEmpty(d.DeliveryHouse), nullIfEmpty(d.DeliveryApartment),
		nullIfEmpty(d.DeliveryLandmark), d.DeliveryLatitude, d.DeliveryLongitude, nullUUID(d.AssignedStoreLocationID),
	)
	if err != nil {
		return domain.Delivery{}, err
	}
	return r.GetDeliveryByID(ctx, d.ID)
}

func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}

func nullUUID(s string) any {
	if s == "" {
		return nil
	}
	return s
}

func (r *Repository) UpdateDeliveryStatus(ctx context.Context, id, status string) error {
	tag, err := r.pool.Exec(ctx, `UPDATE deliveries SET status = $2, updated_at = now() WHERE id = $1`, id, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) InsertTracking(ctx context.Context, deliveryID, status string, lat, lng *float64, note string) (domain.TrackingPoint, error) {
	id := uuid.NewString()
	row := r.pool.QueryRow(ctx, `
		INSERT INTO delivery_tracking (id, delivery_id, status, latitude, longitude, note)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, delivery_id, status, latitude, longitude, COALESCE(note,''), recorded_at`,
		id, deliveryID, status, lat, lng, nullIfEmpty(note))
	var t domain.TrackingPoint
	if err := row.Scan(&t.ID, &t.DeliveryID, &t.Status, &t.Latitude, &t.Longitude, &t.Note, &t.RecordedAt); err != nil {
		return domain.TrackingPoint{}, err
	}
	return t, nil
}

func (r *Repository) ListTracking(ctx context.Context, deliveryID string) ([]domain.TrackingPoint, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, delivery_id, status, latitude, longitude, COALESCE(note,''), recorded_at
		FROM delivery_tracking WHERE delivery_id = $1 ORDER BY recorded_at ASC`, deliveryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.TrackingPoint
	for rows.Next() {
		var t domain.TrackingPoint
		if err := rows.Scan(&t.ID, &t.DeliveryID, &t.Status, &t.Latitude, &t.Longitude, &t.Note, &t.RecordedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// FindNearestStore returns the active store with minimum distance to the point.
func (r *Repository) FindNearestStore(ctx context.Context, lat, lng float64) (domain.StoreLocation, float64, error) {
	stores, err := r.ListActiveStores(ctx)
	if err != nil {
		return domain.StoreLocation{}, 0, err
	}
	if len(stores) == 0 {
		return domain.StoreLocation{}, 0, ErrNotFound
	}
	best := stores[0]
	bestDist := geo.DistanceKm(best.Latitude, best.Longitude, lat, lng)
	for i := 1; i < len(stores); i++ {
		d := geo.DistanceKm(stores[i].Latitude, stores[i].Longitude, lat, lng)
		if d < bestDist {
			best = stores[i]
			bestDist = d
		}
	}
	return best, bestDist, nil
}
