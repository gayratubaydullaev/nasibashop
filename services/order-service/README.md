# Order Service

Spring Boot 3 service for order lifecycle, status history, saga state, and Kafka orchestration hooks.

## REST API (as in ТЗ)

- `POST /api/orders`
- `GET /api/orders/{id}`
- `GET /api/orders/my?userId=...&page=&size=`
- `GET /api/orders/store/{storeId}?status=&page=&size=`
- `PATCH /api/orders/{id}/status`
- `POST /api/orders/{id}/cancel`

## Saga / Kafka flow (local dev)

1. `POST /api/orders` publishes `order.created` after DB commit.
2. `product-service` consumes `order.created` and publishes `stock.reserved` per line item.
3. This service consumes `stock.reserved`, increments per-line `reservedQuantity`, and when all lines are fully reserved publishes `payment.created`.
4. `payment-service` publishes `payment.completed` including `orderId`.
5. This service consumes `payment.completed`, moves the order to `CONFIRMED`, and publishes `order.confirmed` (полный payload для **delivery-service**: адрес, `fulfillmentType`, `storeId`, суммы и т.д.) и `order.status.changed`.

## Configuration

Defaults assume local `docker-compose.yml`:

- Postgres: `jdbc:postgresql://localhost:5432/order_service`
- Kafka: `localhost:9094`
- HTTP port: `8081` (`ORDER_SERVICE_PORT`)

Topic names can be overridden via `app.kafka.topics.*` in `src/main/resources/application.yml`.
