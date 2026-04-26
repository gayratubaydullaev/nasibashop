module github.com/nasibashop/nasibashop/services/delivery-service

go 1.22

require (
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.6.0
	github.com/nasibashop/nasibashop/packages/go-health v0.0.0-00010101000000-000000000000
	github.com/segmentio/kafka-go v0.4.47
)

replace github.com/nasibashop/nasibashop/packages/go-health => ../../packages/go-health
