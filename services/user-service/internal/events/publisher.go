package events

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/segmentio/kafka-go"
)

type Publisher struct {
	writer *kafka.Writer
	logger *slog.Logger
}

func NewKafkaPublisher(brokers []string, logger *slog.Logger) *Publisher {
	return &Publisher{
		writer: &kafka.Writer{
			Addr:         kafka.TCP(brokers...),
			RequiredAcks: kafka.RequireOne,
			Async:        true,
			Balancer:     &kafka.Hash{},
		},
		logger: logger,
	}
}

func (p *Publisher) Publish(ctx context.Context, topic string, key string, payload any) {
	value, err := json.Marshal(payload)
	if err != nil {
		p.logger.Error("marshal kafka event", "topic", topic, "error", err)
		return
	}

	err = p.writer.WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: value,
		Time:  time.Now(),
	})
	if err != nil {
		p.logger.Error("publish kafka event", "topic", topic, "key", key, "error", err)
	}
}

func (p *Publisher) Close() error {
	return p.writer.Close()
}
