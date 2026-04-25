package kafka

import (
	"context"
	"log/slog"
	"time"

	"github.com/segmentio/kafka-go"
)

type MessageHandler func(context.Context, []byte) error

type OrderConfirmedConsumer struct {
	brokers []string
	topic   string
	groupID string
	handler MessageHandler
	logger  *slog.Logger
}

func NewOrderConfirmedConsumer(brokers []string, topic, groupID string, h MessageHandler, logger *slog.Logger) *OrderConfirmedConsumer {
	return &OrderConfirmedConsumer{
		brokers: brokers,
		topic:   topic,
		groupID: groupID,
		handler: h,
		logger:  logger,
	}
}

func (c *OrderConfirmedConsumer) Run(ctx context.Context) {
	if len(c.brokers) == 0 {
		c.logger.Warn("kafka brokers not configured; order.confirmed consumer disabled")
		return
	}
	c.logger.Info("kafka consumer started", "topic", c.topic, "group", c.groupID)

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  c.brokers,
		GroupID:  c.groupID,
		Topic:    c.topic,
		MinBytes: 1,
		MaxBytes: 10e6,
	})
	defer reader.Close()

	for {
		if ctx.Err() != nil {
			return
		}
		msgCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		msg, err := reader.FetchMessage(msgCtx)
		cancel()
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			time.Sleep(time.Second)
			continue
		}
		if err := c.handler(ctx, msg.Value); err != nil {
			c.logger.Error("kafka message handling failed", "topic", c.topic, "error", err)
			continue
		}
		if err := reader.CommitMessages(ctx, msg); err != nil {
			c.logger.Error("kafka commit failed", "topic", c.topic, "error", err)
		}
	}
}
