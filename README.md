# NasibaShop

Монорепозиторий маркетплейса: микросервисы (Go / Java / Node.js / Rust), **Kong** API Gateway, фронты **Next.js 15**, инфраструктура **Docker Compose**, **Helm**, **Terraform (EKS)**.

## Требования

- **Docker** + Docker Compose  
- **Node.js 20+** — `payment-service`, `notification-service`, фронты  
- **Go 1.22+** — user, product, delivery, media  
- **JDK 21+** — `order-service`  
- **Rust** — `search-service`  

## 1. Инфраструктура (локально)

Из корня репозитория:

```bash
docker compose up -d
```

**VPS / занятые порты:** если на сервере уже слушают `6379`, `5432`, `8000` и т.д., скопируйте [`.env.example`](.env.example) в **`.env`**, задайте `NASIBASHOP_REDIS_PORT`, `NASIBASHOP_POSTGRES_PORT`, … (см. комментарии в файле). Микросервисы на хосте тогда укажите на те же порты (`REDIS_ADDR`, `DATABASE_URL`, `NEXT_PUBLIC_API_URL` для Kong).

Поднимаются: **PostgreSQL 16**, **Redis**, **Kafka** (KRaft, внешний порт `9094`), **Meilisearch**, **MongoDB 7**, **Consul**, **Kong** (прокси **`http://localhost:8000`**, Admin **`http://localhost:8001`**).

Базы для сервисов создаются скриптом `infrastructure/docker/postgres/init-multiple-databases.sh` при первом старте Postgres.

Подробнее: [`infrastructure/README.md`](infrastructure/README.md).

## 2. Миграции PostgreSQL

Для каждого сервиса с БД примените SQL из каталога `migrations/` (команды есть в README соответствующего сервиса), например:

```bash
psql "postgres://nasiba:nasiba_dev_password@localhost:5432/user_service?sslmode=disable" -f services/user-service/migrations/001_init.sql
```

Аналогично: `product_service`, `order_service`, `payment_service`, `delivery_service`, `media_service`.

## 3. Порты сервисов (локально, за Kong)

| Сервис | Порт по умолчанию | Префикс через Kong (`:8000`) |
|--------|-------------------|-------------------------------|
| user-service | 8080 | `/api/auth`, `/api/users` |
| product-service | 8083 | `/api/products`, `/api/categories` |
| order-service | 8081 | `/api/orders` |
| payment-service | 8082 | `/api/payments` |
| delivery-service | 8085 | `/api/delivery` |
| search-service | 8086 | `/api/search` |
| notification-service | 8087 | `/api/notifications`, `/ws/notifications`, `/socket.io` |
| media-service | 8088 | `/api/media` |

Переменные окружения и точные команды запуска — в `services/<name>/README.md`.

## 4. API Gateway

Декларативный конфиг: [`services/api-gateway/declarative/kong.yml`](services/api-gateway/declarative/kong.yml).  
Upstream в режиме разработки указывает на `host.docker.internal` и порты из таблицы выше. На выбранных префиксах включена проверка **JWT RS256** (см. [`services/api-gateway/README.md`](services/api-gateway/README.md)); для SSR админки можно задать **`API_GATEWAY_JWT`** в `.env.local` (см. `frontends/admin-panel/.env.example`).

**OpenAPI** (контракт для клиентов через Kong): [`docs/api/gateway-openapi.yaml`](docs/api/gateway-openapi.yaml) — см. [`docs/api/README.md`](docs/api/README.md).

## 5. Фронтенды

| Приложение | Каталог | Порт dev (пример) |
|------------|---------|-------------------|
| Витрина | `frontends/storefront` | 3000 |
| Админка | `frontends/admin-panel` | 3000 или `3001` |

```bash
cd frontends/storefront
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

```bash
cd frontends/admin-panel
cp .env.example .env.local
npm run dev -- --port 3001
```

## 6. Общие пакеты

- **Protobuf / gRPC:** [`packages/shared-proto`](packages/shared-proto) (`buf.yaml`, `*.proto`).  
- **TypeScript типы:** [`packages/shared-types`](packages/shared-types) — подключён в **storefront** и **admin-panel** (`file:`).  
- **ESLint / Prettier / TSconfig:** [`packages/shared-config`](packages/shared-config) — базовый `tsconfig` для Next-приложений.

## 7. Kubernetes и облако

- Шаблоны Helm: [`user-service`](infrastructure/kubernetes/user-service), [`product-service`](infrastructure/kubernetes/product-service), [`order-service`](infrastructure/kubernetes/order-service), [`payment-service`](infrastructure/kubernetes/payment-service/README.md), [`delivery-service`](infrastructure/kubernetes/delivery-service/README.md), [`search-service`](infrastructure/kubernetes/search-service/README.md), [`notification-service`](infrastructure/kubernetes/notification-service/README.md), [`media-service`](infrastructure/kubernetes/media-service/README.md), [`api-gateway`](infrastructure/kubernetes/api-gateway/README.md)  
- Terraform EKS: [`infrastructure/terraform/aws-eks`](infrastructure/terraform/aws-eks)  

## 8. CI/CD (GitHub Actions)

Запуск: **push** / **pull_request** в `main` или `master`, а также вручную (**Actions → CI → Run workflow**). Файл: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

- проверка и сборка **storefront** и **admin-panel**;
- `npm run build` для **payment-service** и **notification-service**;
- `go build` для **user-service**, **product-service**, **delivery-service**, **media-service**;
- `cargo check` для **search-service**;
- `gradle build -x test` для **order-service** (образ `gradle:8.11-jdk21`);
- `npm run typecheck` для **packages/shared-types**;
- `helm lint` + `helm template` для чартов в **`infrastructure/kubernetes/*`**;
- **`kong config parse`** для [`services/api-gateway/declarative/kong.yml`](services/api-gateway/declarative/kong.yml) (образ `kong:3.7`).

## 9. Полезные ссылки

- Техническое задание: [`.cursor/rules/ТЗ.mdc`](.cursor/rules/ТЗ.mdc)  
- **MVP production** (чеклист секретов, Kong, миграции, K8s): [`docs/MVP-PRODUCTION.md`](docs/MVP-PRODUCTION.md)  
- Docker-образы сервисов: `infrastructure/docker/*/Dockerfile`  
- Локальные JWT для Kong + user-service: `npm run jwt:dev` или `node scripts/generate-dev-jwt-keys.cjs` (см. [`services/api-gateway/declarative/dev-not-for-prod/README.md`](services/api-gateway/declarative/dev-not-for-prod/README.md))  
