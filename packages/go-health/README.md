# go-health

Общий модуль для **liveness/readiness** JSON-эндпоинтов в Go-микросервисах NasibaShop.

Подключается через `replace` в `go.mod` сервиса (`../../packages/go-health`). Docker-сборки копируют `packages/go-health` в образ до `go mod tidy` (см. `infrastructure/docker/*-service/Dockerfile`).

## Readiness

- **Postgres** — `Ping` с таймаутом 2 с.
- **Redis** — только в связке с Postgres (user-service).
- **Kafka** — TCP к хотя бы одному брокеру из строки `host:port,…` (передаётся из `KAFKA_BROKERS`). Пустая строка — проверка Kafka **не выполняется** (удобно, если брокер отключён в dev).

Функции: `ReadyPostgres`, `ReadyPostgresKafka`, `ReadyPostgresRedis`, `ReadyPostgresRedisKafka`.

### Формат JSON

- **200** — `{"status":"ok","checks":{...}}` — ключи зависят от набора проверок (`postgres`, `redis`, `kafka` только если брокеры заданы).
- **503** — `{"status":"unavailable","component":"postgres|redis|kafka","checks":{...}}` — в `checks` отражают уже пройденные и упавшие зависимости.
