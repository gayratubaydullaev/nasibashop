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

	"github.com/nasibashop/nasibashop/services/product-service/internal/config"
	"github.com/nasibashop/nasibashop/services/product-service/internal/database"
	"github.com/nasibashop/nasibashop/services/product-service/internal/events"
	httptransport "github.com/nasibashop/nasibashop/services/product-service/internal/http"
	"github.com/nasibashop/nasibashop/services/product-service/internal/repository"
	"github.com/nasibashop/nasibashop/services/product-service/internal/service"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("load config", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("connect postgres", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	publisher := events.NewKafkaPublisher(cfg.KafkaBrokers, logger)
	defer publisher.Close()

	productRepo := repository.NewProductRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)

	productService := service.NewProductService(productRepo, categoryRepo, publisher, logger)
	consumer := events.NewOrderConsumer(cfg.KafkaBrokers, productService, logger)

	go consumer.Run(ctx)

	router := httptransport.NewRouter(productService, logger)
	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		logger.Info("product-service started", "addr", server.Addr)
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
