package http

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/nasibashop/nasibashop/services/media-service/internal/repository"
	"github.com/nasibashop/nasibashop/services/media-service/internal/service"
)

type Handler struct {
	svc    *service.MediaService
	logger *slog.Logger
}

func NewRouter(svc *service.MediaService, logger *slog.Logger) http.Handler {
	h := &Handler{svc: svc, logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", h.health)
	mux.HandleFunc("GET /health/ready", h.health)
	mux.HandleFunc("POST /media/upload", h.upload)
	mux.HandleFunc("GET /media/{id}", h.get)
	mux.HandleFunc("DELETE /media/{id}", h.delete)
	return requestIDMiddleware(mux)
}

func (h *Handler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart")
		return
	}
	file, hdr, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file field required")
		return
	}
	defer file.Close()

	row, err := h.svc.Upload(r.Context(), hdr.Filename, hdr.Header.Get("Content-Type"), file)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"id":          row.ID,
		"contentType": row.ContentType,
		"sizeBytes":   row.SizeBytes,
		"width":       row.Width,
		"height":      row.Height,
		"path":        "/media/" + row.ID,
	})
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	outW := service.ParseIntQuery(r.URL.Query().Get("width"))
	outH := service.ParseIntQuery(r.URL.Query().Get("height"))
	format := r.URL.Query().Get("format")

	data, ct, err := h.svc.GetBytes(r.Context(), id, outW, outH, format)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "read failed")
		return
	}
	w.Header().Set("Content-Type", ct)
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "delete failed")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func requestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if id := strings.TrimSpace(r.Header.Get("X-Request-Id")); id != "" {
			w.Header().Set("X-Trace-Id", id)
		}
		next.ServeHTTP(w, r)
	})
}
