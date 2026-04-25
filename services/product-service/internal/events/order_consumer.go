package events

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
)

// OrderEventHandler — qabul qiluvchi (masalan *service.ProductService), events/service import tsiklini buzish uchun.
type OrderEventHandler interface {
	HandleOrderCreated(ctx context.Context, payload []byte) error
	HandleOrderCancelled(ctx context.Context, payload []byte) error
}

type OrderConsumer struct {
	brokers []string
	handler OrderEventHandler
	logger  *slog.Logger
}

func NewOrderConsumer(brokers []string, handler OrderEventHandler, logger *slog.Logger) *OrderConsumer {
	return &OrderConsumer{
		brokers: brokers,
		handler: handler,
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
		c.consumeTopic(ctx, "order.created", c.handler.HandleOrderCreated)
	}()
	go func() {
		defer wg.Done()
		c.consumeTopic(ctx, "order.cancelled", c.handler.HandleOrderCancelled)
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
