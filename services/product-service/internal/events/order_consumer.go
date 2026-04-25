package events

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"

	"github.com/nasibashop/nasibashop/services/product-service/internal/service"
)

type OrderConsumer struct {
	brokers []string
	service *service.ProductService
	logger  *slog.Logger
}

func NewOrderConsumer(brokers []string, productService *service.ProductService, logger *slog.Logger) *OrderConsumer {
	return &OrderConsumer{
		brokers: brokers,
		service: productService,
		logger:  logger,
	}
}

func (c *OrderConsumer) Run(ctx context.Context) {
	if len(c.brokers) == 0 {
		c.logger.Warn("kafka brokers not configured; order consumer disabled")
		return
	}

	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		c.consumeTopic(ctx, "order.created", c.service.HandleOrderCreated)
	}()
	go func() {
		defer wg.Done()
		c.consumeTopic(ctx, "order.cancelled", c.service.HandleOrderCancelled)
	}()

	<-ctx.Done()
	wg.Wait()
}

type orderHandler func(context.Context, []byte) error

func (c *OrderConsumer) consumeTopic(ctx context.Context, topic string, handler orderHandler) {
	c.logger.Info("kafka consumer started", "topic", topic)

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  c.brokers,
		GroupID:  "product-service",
		Topic:    topic,
		MinBytes: 1,
		MaxBytes: 10e6,
	})
	defer reader.Close()

	for {
		if ctx.Err() != nil {
			return
		}

		msgCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		message, err := reader.FetchMessage(msgCtx)
		cancel()
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			time.Sleep(time.Second)
			continue
		}

		if err := handler(ctx, message.Value); err != nil {
			c.logger.Error("kafka message handling failed", "topic", topic, "error", err)
			continue
		}

		if err := reader.CommitMessages(ctx, message); err != nil {
			c.logger.Error("kafka commit failed", "topic", topic, "error", err)
		}
	}
}
