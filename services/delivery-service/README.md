# delivery-service (Go)

Доставка и самовывоз: точки магазинов, зоны тарифов (радиус + базовая стоимость), расчёт стоимости, сущность **delivery** по событию **`order.confirmed`**.

## Kafka

- **Подписка:** `order.confirmed` (группа `delivery-service`) — идемпотентное создание строки `deliveries` + точка в `delivery_tracking`, публикация **`delivery.created`**.
- **Публикация:** `delivery.created`, `delivery.status.changed` (при `PATCH .../status`).

Payload `order.confirmed` формируется в **order-service** (адрес доставки, `fulfillmentType`, `storeId`, `deliveryFeeUnits`, координаты и т.д.).

## HTTP (порт `8085` по умолчанию)

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/health/live`, `/health/ready` | Проверки |
| GET | `/delivery/stores` | Активные точки |
| POST | `/delivery/stores` | Создать точку (`storeId`, `name`, `addressLine`, `latitude`, `longitude`) |
| GET | `/delivery/stores/nearest?lat=&lng=` | Ближайшая точка + `distanceKm` |
| POST | `/delivery/calculate` | Тариф по зоне (`storeLocationId`, `latitude`, `longitude`; опционально `deliveryLatitude`/`deliveryLongitude`) |
| POST | `/delivery/zones` | Добавить зону (`storeLocationId`, `name`, `centerLatitude`, `centerLongitude`, `radiusKm`, `baseFeeUnits`) |
| GET | `/delivery/{id}` | Карточка доставки |
| PATCH | `/delivery/{id}/status` | Статус + опционально `note`, `latitude`, `longitude` (трек) |
| GET | `/delivery/{id}/tracking` | История трека |

## База данных

БД `delivery_service` уже создаётся скриптом Postgres в `docker-compose`. Примените миграцию:

```bash
psql "postgres://nasiba:nasiba_dev_password@localhost:5432/delivery_service?sslmode=disable" -f migrations/001_init.sql
```

## Переменные окружения

- `HTTP_PORT` (8085)
- `DATABASE_URL`
- `KAFKA_BROKERS` (через запятую; пусто — consumer/publish отключены)
- `KAFKA_TOPIC_ORDER_CONFIRMED` (`order.confirmed`)
- `KAFKA_TOPIC_DELIVERY_CREATED` (`delivery.created`)
- `KAFKA_TOPIC_DELIVERY_STATUS_CHANGED` (`delivery.status.changed`)

## Сборка

```bash
cd services/delivery-service
go mod tidy
go build -o delivery-service ./cmd/server
```

Docker из корня репозитория:

```bash
docker build -f infrastructure/docker/delivery-service/Dockerfile -t nasibashop/delivery-service:local .
```

## Kubernetes (Helm)

Чарт: [`infrastructure/kubernetes/delivery-service`](../../infrastructure/kubernetes/delivery-service/README.md).
