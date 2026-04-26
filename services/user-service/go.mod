module github.com/nasibashop/nasibashop/services/user-service

go 1.22

require (
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.6.0
	github.com/nasibashop/nasibashop/packages/go-health v0.0.0-00010101000000-000000000000
	github.com/redis/go-redis/v9 v9.5.1
	github.com/segmentio/kafka-go v0.4.47
	golang.org/x/crypto v0.23.0
)

replace github.com/nasibashop/nasibashop/packages/go-health => ../../packages/go-health
