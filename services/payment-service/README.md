# payment-service (NestJS)

Обработка платежей для NasibaShop: REST API, Postgres (TypeORM), Redis + BullMQ (отложенный auto-complete в dev), Kafka.

## Согласование с order-service

1. После резерва стока `order-service` публикует **`payment.created`** (ключ сообщения — `paymentId` из саги).
2. Этот сервис **только потребляет** `payment.created` (не публикует его повторно) и поднимает сессию у провайдера (Payme / Click / UZCARD / наложенный платёж).
3. После успешной оплаты публикуется **`payment.completed`** — его слушает `order-service` и переводит заказ в `CONFIRMED`.
4. При **`order.cancelled`** — отмена незавершённого платежа (`payment.failed`) или авто-возврат после `COMPLETED` (`payment.refunded`).

Топик **`order.created`** здесь намеренно не подписан: создание платежа привязано к шагу саги после `stock.reserved`.

## Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `8082` | HTTP порт |
| `DATABASE_URL` | — | Postgres URL для TypeORM |
| `TYPEORM_SYNC` | — | `true` только для локальной разработки |
| `REDIS_HOST` | `localhost` | Redis для BullMQ |
| `REDIS_PORT` | `6379` | |
| `KAFKA_BROKERS` | `localhost:9094` | Список через запятую; пусто — Kafka отключена |
| `KAFKA_CLIENT_ID` | `payment-service` | |
| `KAFKA_GROUP_ID` | `payment-service` | |
| `KAFKA_TOPIC_PAYMENT_CREATED` | `payment.created` | |
| `KAFKA_TOPIC_ORDER_CANCELLED` | `order.cancelled` | |
| `PAYMENT_AUTO_COMPLETE` | `true` | В dev автоматически завершать онлайн-платёж (**в production задайте `false`**, см. Helm `values` и [`docs/MVP-PRODUCTION.md`](../../docs/MVP-PRODUCTION.md)) |
| `PAYMENT_AUTO_COMPLETE_DELAY_MS` | `1500` | Задержка перед job auto-complete |

## HTTP API (префикс `/api`)

- `GET /api/payments` — список платежей (пагинация: `page`, `size`, опционально `status`; для production добавьте auth/RBAC).
- `POST /api/payments/create` — ручное создание платежа по заказу (без повторной публикации `payment.created`).
- `GET /api/payments/:id/status`
- `POST /api/payments/:id/refund`
- `POST /api/payments/payme/callback`, `POST /api/payments/click/callback` — заглушки webhook

## Локальный запуск

```bash
cd services/payment-service
npm install
npm run build
npm run start
```

Схема БД: `db/001_init.sql` (применить к БД `payment_service` или включить `TYPEORM_SYNC=true` только локально).

## Docker

Из корня репозитория:

```bash
docker build -f infrastructure/docker/payment-service/Dockerfile -t nasibashop/payment-service:local .
```
