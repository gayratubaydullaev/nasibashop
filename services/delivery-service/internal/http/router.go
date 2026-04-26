package http

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nasibashop/nasibashop/packages/go-health"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/repository"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/service"
)

type Handler struct {
	svc           *service.DeliveryService
	db            *pgxpool.Pool
	logger        *slog.Logger
	kafkaBrokers  string
}

func NewRouter(svc *service.DeliveryService, db *pgxpool.Pool, logger *slog.Logger, kafkaBrokers string) http.Handler {
	h := &Handler{svc: svc, db: db, logger: logger, kafkaBrokers: kafkaBrokers}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", h.healthLive)
	mux.HandleFunc("GET /health/ready", h.healthReady)

	mux.HandleFunc("GET /delivery/stores", h.listStores)
	mux.HandleFunc("POST /delivery/stores", h.createStore)
	mux.HandleFunc("GET /delivery/stores/nearest", h.nearestStore)
	mux.HandleFunc("POST /delivery/calculate", h.calculate)
	mux.HandleFunc("POST /delivery/zones", h.createZone)

	mux.HandleFunc("GET /delivery/{id}", h.getDelivery)
	mux.HandleFunc("PATCH /delivery/{id}/status", h.patchStatus)
	mux.HandleFunc("GET /delivery/{id}/tracking", h.tracking)

	return requestIDMiddleware(jsonMiddleware(mux))
}

func (h *Handler) healthLive(w http.ResponseWriter, _ *http.Request) {
	health.Live(w)
}

func (h *Handler) healthReady(w http.ResponseWriter, r *http.Request) {
	health.ReadyPostgresKafka(r.Context(), h.db, h.kafkaBrokers, h.logger, w)
}

func (h *Handler) listStores(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.ListStores(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"stores": list})
}

type createStoreBody struct {
	StoreID     string  `json:"storeId"`
	Name        string  `json:"name"`
	AddressLine string  `json:"addressLine"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
}

func (h *Handler) createStore(w http.ResponseWriter, r *http.Request) {
	var body createStoreBody
	if !decodeJSON(w, r, &body) {
		return
	}
	if strings.TrimSpace(body.StoreID) == "" || strings.TrimSpace(body.Name) == "" {
		writeError(w, http.StatusBadRequest, "storeId and name required")
		return
	}
	s, err := h.svc.CreateStore(r.Context(), body.StoreID, body.Name, body.AddressLine, body.Latitude, body.Longitude)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"store": s})
}

func (h *Handler) nearestStore(w http.ResponseWriter, r *http.Request) {
	lat, err1 := parseFloat(r.URL.Query().Get("lat"))
	lng, err2 := parseFloat(r.URL.Query().Get("lng"))
	if err1 != nil || err2 != nil {
		writeError(w, http.StatusBadRequest, "lat and lng query params required")
		return
	}
	out, err := h.svc.NearestStore(r.Context(), lat, lng)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "no stores")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func parseFloat(s string) (float64, error) {
	return strconv.ParseFloat(strings.TrimSpace(s), 64)
}

func (h *Handler) calculate(w http.ResponseWriter, r *http.Request) {
	var req service.CalculateRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	out, err := h.svc.Calculate(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

type createZoneBody struct {
	StoreLocationID string  `json:"storeLocationId"`
	Name            string  `json:"name"`
	CenterLatitude  float64 `json:"centerLatitude"`
	CenterLongitude float64 `json:"centerLongitude"`
	RadiusKm        float64 `json:"radiusKm"`
	BaseFeeUnits     int64   `json:"baseFeeUnits"`
}

func (h *Handler) createZone(w http.ResponseWriter, r *http.Request) {
	var body createZoneBody
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.StoreLocationID == "" || body.Name == "" {
		writeError(w, http.StatusBadRequest, "storeLocationId and name required")
		return
	}
	if body.RadiusKm <= 0 {
		body.RadiusKm = 5
	}
	z, err := h.svc.CreateZone(r.Context(), body.StoreLocationID, body.Name, body.CenterLatitude, body.CenterLongitude, body.RadiusKm, body.BaseFeeUnits)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"zone": z})
}

func (h *Handler) getDelivery(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	d, err := h.svc.GetDelivery(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"delivery": d})
}

func (h *Handler) patchStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req service.UpdateStatusRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	d, err := h.svc.UpdateStatus(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"delivery": d})
}

func (h *Handler) tracking(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	d, err := h.svc.GetDelivery(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	// list tracking via repo — expose through service
	points, err := h.svc.ListTracking(r.Context(), d.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"deliveryId": d.ID, "points": points})
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dest any) bool {
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(dest); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func jsonMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

func requestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if id := strings.TrimSpace(r.Header.Get("X-Request-Id")); id != "" {
			w.Header().Set("X-Trace-Id", id)
		}
		next.ServeHTTP(w, r)
	})
}
