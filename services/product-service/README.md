# Product Service

Go service responsible for catalog, variants, stock, categories, and Kafka integration with orders.

## Features

- CRUD products with variants and images.
- Category tree API.
- Stock management per variant and store.
- CSV import/export for products.
- Kafka publish: `product.created`, `product.updated`, `product.deleted`, `product.stock.changed`.
- Kafka consume: `order.created` (reserve stock), `order.cancelled` (release stock).
- Kafka publish confirmations: `stock.reserved`, `stock.released`.

## REST API

- `POST /products`
- `PATCH /products/{id}`
- `DELETE /products/{id}`
- `GET /products/{id}`
- `GET /products`
- `PATCH /products/{id}/stock`
- `GET /products/export.csv?storeId=...`
- `POST /products/import.csv`
- `GET /categories`
- `POST /categories`
- `GET /health/live`
- `GET /health/ready`

## Local Run

Start dependencies from the repository root:

```bash
docker compose up -d postgres kafka
```

Apply `migrations/001_init.sql` to the `product_service` database, then:

```bash
go run ./cmd/server
```

Environment variables:

- `HTTP_PORT` defaults to `8083` (чтобы не пересекаться с `user-service` на `8080` и для API Gateway).
- `DATABASE_URL` defaults to local compose PostgreSQL.
- `KAFKA_BROKERS` defaults to `localhost:9094`.

## Order event payload expectations

`order.created` and `order.cancelled` messages should include JSON fields:

- `orderId`
- `storeId`
- `items[]` with `variantId` and `quantity` (and `productId` for `order.created`).
