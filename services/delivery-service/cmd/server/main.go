package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/nasibashop/nasibashop/services/delivery-service/internal/config"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/database"
	httptransport "github.com/nasibashop/nasibashop/services/delivery-service/internal/http"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/kafka"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/repository"
	"github.com/nasibashop/nasibashop/services/delivery-service/internal/service"
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

	pub := kafka.NewPublisher(cfg.KafkaBrokers, logger)
	defer pub.Close()

	repo := repository.New(db)
	svc := service.NewDeliveryService(repo, pub, cfg, logger)

	consumer := kafka.NewOrderConfirmedConsumer(
		cfg.KafkaBrokers,
		cfg.TopicOrderConfirmed,
		"delivery-service",
		svc.HandleOrderConfirmed,
		logger,
	)
	go consumer.Run(ctx)

	router := httptransport.NewRouter(svc, db, logger, strings.Join(cfg.KafkaBrokers, ","))
	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		logger.Info("delivery-service started", "addr", server.Addr)
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
