module github.com/nasibashop/nasibashop/services/media-service

go 1.22

require (
	github.com/chai2010/webp v1.4.0
	github.com/disintegration/imaging v1.6.2
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.6.0
	github.com/minio/minio-go/v7 v7.0.69
	github.com/nasibashop/nasibashop/packages/go-health v0.0.0-00010101000000-000000000000
	github.com/segmentio/kafka-go v0.4.47
	golang.org/x/image v0.18.0
)

replace github.com/nasibashop/nasibashop/packages/go-health => ../../packages/go-health
