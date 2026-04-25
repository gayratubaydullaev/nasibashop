package http

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"

	"github.com/nasibashop/nasibashop/services/product-service/internal/domain"
	"github.com/nasibashop/nasibashop/services/product-service/internal/repository"
	"github.com/nasibashop/nasibashop/services/product-service/internal/service"
)

type Handler struct {
	service *service.ProductService
	logger  *slog.Logger
}

func NewRouter(productService *service.ProductService, logger *slog.Logger) http.Handler {
	handler := &Handler{service: productService, logger: logger}
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health/live", handler.health)
	mux.HandleFunc("GET /health/ready", handler.health)

	mux.HandleFunc("GET /products", handler.listProducts)
	mux.HandleFunc("POST /products", handler.createProduct)
	mux.HandleFunc("GET /products/{id}", handler.getProduct)
	mux.HandleFunc("PATCH /products/{id}", handler.updateProduct)
	mux.HandleFunc("DELETE /products/{id}", handler.deleteProduct)

	mux.HandleFunc("PATCH /products/{id}/stock", handler.updateStock)

	mux.HandleFunc("GET /products/export.csv", handler.exportProductsCSV)
	mux.HandleFunc("POST /products/import.csv", handler.importProductsCSV)

	mux.HandleFunc("GET /categories", handler.listCategories)
	mux.HandleFunc("POST /categories", handler.createCategory)

	return requestIDMiddleware(jsonMiddleware(mux))
}

func (h *Handler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) createProduct(w http.ResponseWriter, r *http.Request) {
	var product domain.Product
	if !decodeJSON(w, r, &product) {
		return
	}

	if product.ID == "" {
		product.ID = uuid.NewString()
	}

	created, err := h.service.CreateProduct(r.Context(), product)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"product": created})
}

func (h *Handler) updateProduct(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var product domain.Product
	if !decodeJSON(w, r, &product) {
		return
	}

	updated, err := h.service.UpdateProduct(r.Context(), id, product)
	if err != nil {
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"product": updated})
}

func (h *Handler) deleteProduct(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.service.DeleteProduct(r.Context(), id); err != nil {
		writeRepositoryError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) getProduct(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	full, err := h.service.GetProduct(r.Context(), id)
	if err != nil {
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"product": full})
}

func (h *Handler) listProducts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	filters := domain.ProductFilters{
		Query:      query.Get("q"),
		CategoryID: query.Get("categoryId"),
		StoreID:    query.Get("storeId"),
		Brand:      query.Get("brand"),
	}

	if query.Get("inStockOnly") == "true" {
		filters.InStockOnly = true
	}

	if status := query.Get("status"); status != "" {
		filters.Status = domain.ProductStatus(status)
	}

	if min := query.Get("minPrice"); min != "" {
		value, err := strconv.ParseInt(min, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid minPrice")
			return
		}
		filters.MinPriceUnits = &value
	}
	if max := query.Get("maxPrice"); max != "" {
		value, err := strconv.ParseInt(max, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid maxPrice")
			return
		}
		filters.MaxPriceUnits = &value
	}

	if limit := query.Get("limit"); limit != "" {
		value, err := strconv.Atoi(limit)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid limit")
			return
		}
		filters.Limit = value
	}
	if offset := query.Get("offset"); offset != "" {
		value, err := strconv.Atoi(offset)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid offset")
			return
		}
		filters.Offset = value
	}

	products, total, err := h.service.ListProducts(r.Context(), filters)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"products": products,
		"pagination": map[string]any{
			"totalCount": total,
		},
	})
}

func (h *Handler) updateStock(w http.ResponseWriter, r *http.Request) {
	productID := r.PathValue("id")

	var input struct {
		VariantID string `json:"variantId"`
		StoreID   string `json:"storeId"`
		Quantity  int    `json:"quantity"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	stock, err := h.service.UpdateStock(r.Context(), productID, input.VariantID, input.StoreID, input.Quantity)
	if err != nil {
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"stock": stock})
}

func (h *Handler) exportProductsCSV(w http.ResponseWriter, r *http.Request) {
	storeID := r.URL.Query().Get("storeId")
	if storeID == "" {
		writeError(w, http.StatusBadRequest, "storeId is required")
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=products.csv")

	if err := h.service.ExportProductsCSV(r.Context(), storeID, w); err != nil {
		h.logger.Error("export csv failed", "error", err)
	}
}

func (h *Handler) importProductsCSV(w http.ResponseWriter, r *http.Request) {
	count, err := h.service.ImportProductsCSV(r.Context(), r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"imported": count})
}

func (h *Handler) listCategories(w http.ResponseWriter, r *http.Request) {
	tree, err := h.service.GetCategories(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"categories": tree})
}

func (h *Handler) createCategory(w http.ResponseWriter, r *http.Request) {
	var category domain.Category
	if !decodeJSON(w, r, &category) {
		return
	}

	if category.ID == "" {
		category.ID = uuid.NewString()
	}

	created, err := h.service.CreateCategory(r.Context(), category)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"category": created})
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

func writeRepositoryError(w http.ResponseWriter, err error) {
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	writeError(w, http.StatusInternalServerError, "internal error")
}

func jsonMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/products/export.csv") {
			next.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

func requestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		traceID := r.Header.Get("X-Request-Id")
		if traceID == "" {
			traceID = r.Header.Get("X-Trace-Id")
		}
		if traceID != "" {
			w.Header().Set("X-Trace-Id", traceID)
		}
		next.ServeHTTP(w, r)
	})
}
