package http

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/nasibashop/nasibashop/services/user-service/internal/domain"
	"github.com/nasibashop/nasibashop/services/user-service/internal/repository"
	"github.com/nasibashop/nasibashop/services/user-service/internal/security"
	"github.com/nasibashop/nasibashop/services/user-service/internal/service"
)

type contextKey string

const claimsContextKey contextKey = "claims"

type Handler struct {
	auth   *service.AuthService
	tokens *security.TokenManager
	logger *slog.Logger
}

func NewRouter(auth *service.AuthService, tokens *security.TokenManager, logger *slog.Logger) http.Handler {
	handler := &Handler{auth: auth, tokens: tokens, logger: logger}
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health/live", handler.health)
	mux.HandleFunc("GET /health/ready", handler.health)
	mux.HandleFunc("POST /auth/register", handler.register)
	mux.HandleFunc("POST /auth/login", handler.login)
	mux.HandleFunc("POST /auth/refresh", handler.refresh)
	mux.HandleFunc("POST /auth/validate", handler.validateToken)
	mux.HandleFunc("GET /users/{id}", handler.requireAuth(handler.getUser))
	mux.HandleFunc("PATCH /users/{id}", handler.requireAuth(handler.updateProfile))
	mux.HandleFunc("POST /users/{id}/addresses", handler.requireAuth(handler.addAddress))

	return requestIDMiddleware(jsonMiddleware(mux))
}

func (h *Handler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	var input domain.RegisterInput
	if !decodeJSON(w, r, &input) {
		return
	}

	user, tokens, err := h.auth.Register(r.Context(), input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"user":   user,
		"tokens": tokens,
	})
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var input domain.AuthenticateInput
	if !decodeJSON(w, r, &input) {
		return
	}

	if input.UserAgent == "" {
		input.UserAgent = r.UserAgent()
	}
	if input.IPAddress == "" {
		input.IPAddress = clientIP(r)
	}

	user, tokens, err := h.auth.Authenticate(r.Context(), input)
	if err != nil {
		status := http.StatusUnauthorized
		if errors.Is(err, service.ErrInactiveUser) {
			status = http.StatusForbidden
		}
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"user":   user,
		"tokens": tokens,
	})
}

func (h *Handler) refresh(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshToken string `json:"refreshToken"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	tokens, err := h.auth.Refresh(r.Context(), input.RefreshToken)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"tokens": tokens})
}

func (h *Handler) validateToken(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Token string `json:"token"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}

	claims, err := h.auth.ValidateToken(r.Context(), input.Token)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{"valid": false})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"valid":  true,
		"claims": claims,
	})
}

func (h *Handler) getUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	user, err := h.auth.GetUser(r.Context(), id)
	if err != nil {
		writeRepositoryError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) updateProfile(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !canAccessUser(r.Context(), id) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var input domain.UpdateProfileInput
	if !decodeJSON(w, r, &input) {
		return
	}

	user, err := h.auth.UpdateProfile(r.Context(), id, input)
	if err != nil {
		writeRepositoryError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) addAddress(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if !canAccessUser(r.Context(), userID) {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var address domain.Address
	if !decodeJSON(w, r, &address) {
		return
	}

	created, err := h.auth.AddAddress(r.Context(), userID, address)
	if err != nil {
		writeRepositoryError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"address": created})
}

func (h *Handler) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := bearerToken(r.Header.Get("Authorization"))
		if token == "" {
			writeError(w, http.StatusUnauthorized, "missing bearer token")
			return
		}

		claims, err := h.tokens.ValidateAccessToken(token)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid bearer token")
			return
		}

		ctx := context.WithValue(r.Context(), claimsContextKey, claims)
		next(w, r.WithContext(ctx))
	}
}

func canAccessUser(ctx context.Context, userID string) bool {
	claims, ok := ctx.Value(claimsContextKey).(domain.Claims)
	if !ok {
		return false
	}
	if claims.UserID == userID {
		return true
	}
	for _, role := range claims.Roles {
		if role == domain.RoleSuperAdmin {
			return true
		}
	}
	return false
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

func bearerToken(value string) string {
	const prefix = "Bearer "
	if !strings.HasPrefix(value, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(value, prefix))
}

func clientIP(r *http.Request) string {
	if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
		parts := strings.Split(forwardedFor, ",")
		return strings.TrimSpace(parts[0])
	}
	return r.RemoteAddr
}

func jsonMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
