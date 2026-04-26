package health

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"
)

// PingKafkaTCP checks that at least one broker in CSV "host:port,host2:port2" accepts TCP.
// Empty or whitespace-only brokers returns nil (Kafka treated as optional / not configured).
func PingKafkaTCP(ctx context.Context, brokers string) error {
	brokers = strings.TrimSpace(brokers)
	if brokers == "" {
		return nil
	}
	d := net.Dialer{Timeout: 2 * time.Second}
	var lastErr error
	any := false
	for _, addr := range strings.Split(brokers, ",") {
		addr = strings.TrimSpace(addr)
		if addr == "" {
			continue
		}
		any = true
		conn, err := d.DialContext(ctx, "tcp", addr)
		if err != nil {
			lastErr = err
			continue
		}
		_ = conn.Close()
		return nil
	}
	if !any {
		return nil
	}
	if lastErr != nil {
		return fmt.Errorf("kafka tcp: %w", lastErr)
	}
	return fmt.Errorf("kafka: no valid broker addresses")
}
