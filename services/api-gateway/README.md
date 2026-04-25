# API Gateway (Kong)

Единая точка входа для фронтендов по ТЗ: роутинг к микросервисам, **CORS**, **correlation-id** (`X-Request-Id`), **rate limiting** (100 запросов/сек на IP), **JWT RS256** на защищённых префиксах (плюс 30 запросов/сек на consumer после успешной аутентификации).

## Порты

| Порт | Назначение |
|------|------------|
| `8000` | Proxy (все клиентские запросы сюда) |
| `8001` | Admin API (статус, конфиг в DB-less режиме ограничен) |

## Роутинг (префикс → сервис)

| Префикс | Upstream |
|-----------|----------|
| `/api/auth` | user-service (`/auth/...`) |
| `/api/users` | user-service (`/users/...`) |
| `/api/products` | product-service |
| `/api/categories` | product-service (категории вне префикса `/products`) |
| `/api/orders` | order-service |
| `/api/payments` | payment-service |
| `/api/delivery` | delivery-service |
| `/api/search` | search-service |
| `/api/notifications` | notification-service (REST) |
| `/ws/notifications` | notification-service (Socket.IO namespace) |
| `/socket.io` | notification-service (транспорт Socket.IO) |
| `/api/media` | media-service |

По умолчанию upstream ходит на **`host.docker.internal`** с портами сервисов на хосте: user **8080**, product **8083**, order **8081**, payment **8082**, delivery **8085**, search **8086**, notification **8087**, media **8088**.

## JWT (RS256) на Gateway

- Декларативный конфиг: `declarative/kong.yml` — consumer **`nasibashop-dev`**, credential **`key`** = `nasibashop-user-service` (= claim **`iss`** в access-токене user-service).
- Публичный ключ встроен в `kong.yml`. После `git clone` выполните из **корня репозитория**: `npm run jwt:dev` или `node scripts/generate-dev-jwt-keys.cjs` — создаёт приватный PEM (не в git) и синхронизирует public в `kong.yml` (см. [README](declarative/dev-not-for-prod/README.md)). **Не использовать в production.**
- Плагин **`jwt`** включён для: `/api/users`, `/api/orders`, `/api/payments` (кроме POST webhook Payme/Click/Uzcard), `/api/notifications`, мутаций `/api/media` (POST/DELETE/PUT/PATCH).
- **Без JWT:** `/api/auth`, каталог `/api/products` и `/api/categories`, `/api/search`, `/api/delivery`, чтение `/api/media` (GET/HEAD), WebSocket `/ws/notifications` и `/socket.io`, провайдерские callback-и оплаты.

Локально задайте **`JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`** в `user-service` из той же пары, иначе выданный токен Kong отвергнёт.

### Admin Panel (SSR)

Server Components ходят на Kong без браузерной сессии. Для защищённых маршрутов задайте в **`frontends/admin-panel/.env.local`** переменную **`API_GATEWAY_JWT`** = access-токен из `POST /api/auth/login` (см. `.env.example`).

## Запуск с корневым docker-compose

```bash
docker compose up -d kong
```

Прокси: `http://localhost:8000`. Пример:

```bash
curl -s http://localhost:8000/api/products | head
```

## Образ только с декларативным конфигом

```bash
docker build -f infrastructure/docker/api-gateway/Dockerfile -t nasibashop/api-gateway:dev .
```

Для Kubernetes: Helm-чарт **`infrastructure/kubernetes/api-gateway`** генерирует declarative-конфиг с upstream в кластере (`user-service:8080`, …); см. [README](../../infrastructure/kubernetes/api-gateway/README.md).
