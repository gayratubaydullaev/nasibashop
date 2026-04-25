package service

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/nasibashop/nasibashop/services/delivery-service/internal/config"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/domain"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/geo"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/kafka"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/repository"
)

type DeliveryService struct {
	repo   *repository.Repository
	pub    *kafka.Publisher
	cfg    config.Config
	logger *slog.Logger
}

func NewDeliveryService(repo *repository.Repository, pub *kafka.Publisher, cfg config.Config, logger *slog.Logger) *DeliveryService {
	return &DeliveryService{repo: repo, pub: pub, cfg: cfg, logger: logger}
}

type OrderConfirmedPayload struct {
	OrderID           string   `json:"orderId"`
	UserID            string   `json:"userId"`
	StoreID           string   `json:"storeId"`
	FulfillmentType   string   `json:"fulfillmentType"`
	Currency          string   `json:"currency"`
	TotalUnits        int64    `json:"totalUnits"`
	DeliveryFeeUnits  int64    `json:"deliveryFeeUnits"`
	PickupStoreID     string   `json:"pickupStoreId"`
	DeliveryRegion    string   `json:"deliveryRegion"`
	DeliveryDistrict  string   `json:"deliveryDistrict"`
	DeliveryStreet    string   `json:"deliveryStreet"`
	DeliveryHouse     string   `json:"deliveryHouse"`
	DeliveryApartment string   `json:"deliveryApartment"`
	DeliveryLandmark  string   `json:"deliveryLandmark"`
	DeliveryLatitude  *float64 `json:"deliveryLatitude"`
	DeliveryLongitude *float64 `json:"deliveryLongitude"`
}

func (s *DeliveryService) HandleOrderConfirmed(ctx context.Context, raw []byte) error {
	var payload OrderConfirmedPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return err
	}
	if payload.OrderID == "" {
		return nil
	}

	if _, err := s.repo.GetDeliveryByOrderID(ctx, payload.OrderID); err == nil {
		return nil
	} else if !errors.Is(err, repository.ErrNotFound) {
		return err
	}

	assigned, fee := s.resolveStoreAndFee(ctx, payload)

	d := domain.Delivery{
		OrderID:                 payload.OrderID,
		UserID:                  payload.UserID,
		StoreID:                 payload.StoreID,
		FulfillmentType:         payload.FulfillmentType,
		FeeUnits:                fee,
		CurrencyCode:            defaultStr(payload.Currency, "UZS"),
		PickupStoreID:           payload.PickupStoreID,
		DeliveryRegion:          payload.DeliveryRegion,
		DeliveryDistrict:        payload.DeliveryDistrict,
		DeliveryStreet:          payload.DeliveryStreet,
		DeliveryHouse:           payload.DeliveryHouse,
		DeliveryApartment:       payload.DeliveryApartment,
		DeliveryLandmark:        payload.DeliveryLandmark,
		DeliveryLatitude:        payload.DeliveryLatitude,
		DeliveryLongitude:       payload.DeliveryLongitude,
		AssignedStoreLocationID: assigned.ID,
	}

	switch strings.ToUpper(payload.FulfillmentType) {
	case domain.FulfillmentPickup:
		d.Status = domain.StatusReadyForPickup
	case domain.FulfillmentDelivery:
		d.Status = domain.StatusCreated
	default:
		d.Status = domain.StatusCreated
	}

	created, err := s.repo.InsertDelivery(ctx, d)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil
		}
		return err
	}

	if _, err := s.repo.InsertTracking(ctx, created.ID, created.Status, nil, nil, "delivery record created"); err != nil {
		s.logger.Error("tracking insert failed", "error", err)
	}

	s.pub.Publish(ctx, s.cfg.TopicDeliveryCreated, created.ID, map[string]any{
		"deliveryId":  created.ID,
		"orderId":     created.OrderID,
		"userId":      created.UserID,
		"storeId":     created.StoreID,
		"status":      created.Status,
		"feeUnits":    created.FeeUnits,
		"currency":    created.CurrencyCode,
		"fulfillment": created.FulfillmentType,
		"timestamp":   created.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	})
	return nil
}

func (s *DeliveryService) resolveStoreAndFee(ctx context.Context, p OrderConfirmedPayload) (domain.StoreLocation, int64) {
	var assigned domain.StoreLocation
	var err error
	if p.StoreID != "" {
		assigned, err = s.repo.GetStoreLocationByBusinessStoreID(ctx, p.StoreID)
		if err != nil && !errors.Is(err, repository.ErrNotFound) {
			s.logger.Warn("store lookup failed", "storeId", p.StoreID, "error", err)
		}
	}
	if assigned.ID == "" && p.DeliveryLatitude != nil && p.DeliveryLongitude != nil {
		assigned, _, err = s.repo.FindNearestStore(ctx, *p.DeliveryLatitude, *p.DeliveryLongitude)
		if err != nil {
			s.logger.Warn("nearest store failed", "error", err)
		}
	}
	if assigned.ID == "" {
		stores, err := s.repo.ListActiveStores(ctx)
		if err == nil && len(stores) > 0 {
			assigned = stores[0]
		}
	}

	fee := p.DeliveryFeeUnits
	if fee <= 0 && assigned.ID != "" {
		fee = s.feeFromZones(ctx, assigned.ID, p)
	}
	if fee <= 0 {
		fee = s.cfg.DefaultFeeUnits
	}
	return assigned, fee
}

func (s *DeliveryService) feeFromZones(ctx context.Context, storeLocationID string, p OrderConfirmedPayload) int64 {
	if p.DeliveryLatitude == nil || p.DeliveryLongitude == nil {
		return s.cfg.DefaultFeeUnits
	}
	zones, err := s.repo.ListZonesForStoreLocation(ctx, storeLocationID)
	if err != nil || len(zones) == 0 {
		return s.cfg.DefaultFeeUnits
	}
	lat, lng := *p.DeliveryLatitude, *p.DeliveryLongitude
	var best int64 = -1
	for _, z := range zones {
		d := geo.DistanceKm(z.CenterLatitude, z.CenterLongitude, lat, lng)
		if d <= z.RadiusKm {
			if best < 0 || z.BaseFeeUnits < best {
				best = z.BaseFeeUnits
			}
		}
	}
	if best < 0 {
		return s.cfg.DefaultFeeUnits
	}
	return best
}

func defaultStr(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}

func (s *DeliveryService) ListStores(ctx context.Context) ([]domain.StoreLocation, error) {
	return s.repo.ListActiveStores(ctx)
}

func (s *DeliveryService) CreateStore(ctx context.Context, storeID, name, address string, lat, lng float64) (domain.StoreLocation, error) {
	return s.repo.CreateStore(ctx, storeID, name, address, lat, lng)
}

func (s *DeliveryService) NearestStore(ctx context.Context, lat, lng float64) (map[string]any, error) {
	store, dist, err := s.repo.FindNearestStore(ctx, lat, lng)
	if err != nil {
		return nil, err
	}
	return map[string]any{"store": store, "distanceKm": dist}, nil
}

type CalculateRequest struct {
	StoreLocationID string   `json:"storeLocationId"`
	Latitude        float64  `json:"latitude"`
	Longitude       float64  `json:"longitude"`
	DeliveryLat     *float64 `json:"deliveryLatitude"`
	DeliveryLng     *float64 `json:"deliveryLongitude"`
}

func (s *DeliveryService) CreateZone(ctx context.Context, storeLocationID, name string, clat, clng, radiusKm float64, baseFeeUnits int64) (domain.DeliveryZone, error) {
	return s.repo.InsertZone(ctx, storeLocationID, name, clat, clng, radiusKm, baseFeeUnits)
}

func (s *DeliveryService) Calculate(ctx context.Context, req CalculateRequest) (map[string]any, error) {
	if req.StoreLocationID == "" {
		return nil, errors.New("storeLocationId required")
	}
	dlat, dlng := req.Latitude, req.Longitude
	if req.DeliveryLat != nil && req.DeliveryLng != nil {
		dlat, dlng = *req.DeliveryLat, *req.DeliveryLng
	}
	zones, err := s.repo.ListZonesForStoreLocation(ctx, req.StoreLocationID)
	if err != nil {
		return nil, err
	}
	var fee int64 = s.cfg.DefaultFeeUnits
	var matched string
	for _, z := range zones {
		if geo.DistanceKm(z.CenterLatitude, z.CenterLongitude, dlat, dlng) <= z.RadiusKm {
			if matched == "" || z.BaseFeeUnits < fee {
				fee = z.BaseFeeUnits
				matched = z.Name
			}
		}
	}
	return map[string]any{"feeUnits": fee, "currency": "UZS", "matchedZone": matched}, nil
}

func (s *DeliveryService) GetDelivery(ctx context.Context, id string) (domain.Delivery, error) {
	return s.repo.GetDeliveryByID(ctx, id)
}

func (s *DeliveryService) ListTracking(ctx context.Context, deliveryID string) ([]domain.TrackingPoint, error) {
	return s.repo.ListTracking(ctx, deliveryID)
}

type UpdateStatusRequest struct {
	Status   string   `json:"status"`
	Note     string   `json:"note"`
	Latitude *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
}

func (s *DeliveryService) UpdateStatus(ctx context.Context, id string, req UpdateStatusRequest) (domain.Delivery, error) {
	if strings.TrimSpace(req.Status) == "" {
		return domain.Delivery{}, errors.New("status required")
	}
	cur, err := s.repo.GetDeliveryByID(ctx, id)
	if err != nil {
		return domain.Delivery{}, err
	}
	if err := s.repo.UpdateDeliveryStatus(ctx, id, req.Status); err != nil {
		return domain.Delivery{}, err
	}
	if _, err := s.repo.InsertTracking(ctx, id, req.Status, req.Latitude, req.Longitude, req.Note); err != nil {
		return domain.Delivery{}, err
	}
	updated, err := s.repo.GetDeliveryByID(ctx, id)
	if err != nil {
		return domain.Delivery{}, err
	}
	s.pub.Publish(ctx, s.cfg.TopicDeliveryStatus, id, map[string]any{
		"deliveryId": id,
		"orderId":    updated.OrderID,
		"oldStatus":  cur.Status,
		"newStatus":  req.Status,
		"timestamp":  updated.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	})
	return updated, nil
}
