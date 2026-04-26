// Package health provides small JSON helpers for HTTP liveness/readiness probes.
package health

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func readyOK(w http.ResponseWriter, checks map[string]string) {
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok", "checks": checks})
}

func ready503(w http.ResponseWriter, component string, checks map[string]string) {
	writeJSON(w, http.StatusServiceUnavailable, map[string]any{
		"status":    "unavailable",
		"component": component,
		"checks":    checks,
	})
}

func pingPostgres(ctx context.Context, db *pgxpool.Pool) error {
	c, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return db.Ping(c)
}

func pingRedis(ctx context.Context, rdb *redis.Client) error {
	c, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return rdb.Ping(c).Err()
}

// Live responds 200 OK when the process is up (no dependency checks).
func Live(w http.ResponseWriter) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ReadyPostgres pings PostgreSQL with a short timeout; on failure responds 503.
func ReadyPostgres(ctx context.Context, db *pgxpool.Pool, log *slog.Logger, w http.ResponseWriter) {
	if err := pingPostgres(ctx, db); err != nil {
		if log != nil {
			log.Warn("health ready: postgres", "error", err)
		}
		ready503(w, "postgres", map[string]string{"postgres": "DOWN"})
		return
	}
	readyOK(w, map[string]string{"postgres": "UP"})
}

// ReadyPostgresRedis pings Postgres then Redis; on failure responds 503 with a component hint.
func ReadyPostgresRedis(ctx context.Context, db *pgxpool.Pool, rdb *redis.Client, log *slog.Logger, w http.ResponseWriter) {
	if err := pingPostgres(ctx, db); err != nil {
		if log != nil {
			log.Warn("health ready: postgres", "error", err)
		}
		ready503(w, "postgres", map[string]string{"postgres": "DOWN"})
		return
	}
	if err := pingRedis(ctx, rdb); err != nil {
		if log != nil {
			log.Warn("health ready: redis", "error", err)
		}
		ready503(w, "redis", map[string]string{"postgres": "UP", "redis": "DOWN"})
		return
	}
	readyOK(w, map[string]string{"postgres": "UP", "redis": "UP"})
}

// ReadyPostgresKafka pings Postgres, then optionally Kafka (TCP to brokers CSV); empty brokers skips Kafka.
func ReadyPostgresKafka(ctx context.Context, db *pgxpool.Pool, kafkaBrokers string, log *slog.Logger, w http.ResponseWriter) {
	if err := pingPostgres(ctx, db); err != nil {
		if log != nil {
			log.Warn("health ready: postgres", "error", err)
		}
		ready503(w, "postgres", map[string]string{"postgres": "DOWN"})
		return
	}
	checks := map[string]string{"postgres": "UP"}
	if strings.TrimSpace(kafkaBrokers) != "" {
		kctx, kcancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer kcancel()
		if err := PingKafkaTCP(kctx, kafkaBrokers); err != nil {
			if log != nil {
				log.Warn("health ready: kafka", "error", err)
			}
			ready503(w, "kafka", map[string]string{"postgres": "UP", "kafka": "DOWN"})
			return
		}
		checks["kafka"] = "UP"
	}
	readyOK(w, checks)
}

// ReadyPostgresRedisKafka pings Postgres, Redis, then optionally Kafka (brokers CSV).
func ReadyPostgresRedisKafka(
	ctx context.Context,
	db *pgxpool.Pool,
	rdb *redis.Client,
	kafkaBrokers string,
	log *slog.Logger,
	w http.ResponseWriter,
) {
	if err := pingPostgres(ctx, db); err != nil {
		if log != nil {
			log.Warn("health ready: postgres", "error", err)
		}
		ready503(w, "postgres", map[string]string{"postgres": "DOWN"})
		return
	}
	if err := pingRedis(ctx, rdb); err != nil {
		if log != nil {
			log.Warn("health ready: redis", "error", err)
		}
		ready503(w, "redis", map[string]string{"postgres": "UP", "redis": "DOWN"})
		return
	}
	checks := map[string]string{"postgres": "UP", "redis": "UP"}
	if strings.TrimSpace(kafkaBrokers) != "" {
		kctx, kcancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer kcancel()
		if err := PingKafkaTCP(kctx, kafkaBrokers); err != nil {
			if log != nil {
				log.Warn("health ready: kafka", "error", err)
			}
			ready503(w, "kafka", map[string]string{"postgres": "UP", "redis": "UP", "kafka": "DOWN"})
			return
		}
		checks["kafka"] = "UP"
	}
	readyOK(w, checks)
}
