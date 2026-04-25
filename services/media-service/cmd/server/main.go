package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nasibashop/nasibashop/services/media-service/internal/config"
	"github.com/nasibashop/nasibashop/services/media-service/internal/database"
	httptransport "github.com/nasibashop/nasibashop/services/media-service/internal/http"
	"github.com/nasibashop/nasibashop/services/media-service/internal/kafka"
	"github.com/nasibashop/nasibashop/services/media-service/internal/repository"
	"github.com/nasibashop/nasibashop/services/media-service/internal/service"
	"github.com/nasibashop/nasibashop/services/media-service/internal/storage"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	cfg := config.Load()
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("connect postgres", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	store, err := storage.New(cfg)
	if err != nil {
		logger.Error("init storage", "error", err)
		os.Exit(1)
	}

	pub := kafka.NewPublisher(cfg.KafkaBrokers, logger)
	defer pub.Close()

	repo := repository.New(db)
	svc := service.NewMediaService(cfg, repo, store, pub, logger)
	router := httptransport.NewRouter(svc, logger)

	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Info("media-service started", "addr", server.Addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("http server failed", "error", err)
			stop()
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown http server", "error", err)
	}
}
