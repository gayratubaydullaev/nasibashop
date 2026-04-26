# NasibaShop

Монорепозиторий маркетплейса: микросервисы (Go / Java / Node.js / Rust), **Kong** API Gateway, фронты **Next.js 15**, инфраструктура **Docker Compose**, **Helm**, **Terraform (EKS)**.

## Быстрый старт: только инфра (БД, Redis, Kafka, Kong…)

**Node.js 20+** в пути (для скрипта JWT). **Docker** с Compose.

1. Скопируйте [`.env.example`](.env.example) в **`.env`**. Чтобы **сразу** все внешние порты перенести с «классических» 5432/8000/…, добавьте готовый профиль: `cat [environment/nasibashop-nested-ports.env](environment/nasibashop-nested-ports.env) >> .env` (Kong с хоста: **18000**, admin **18001**; см. комментарии в файле). Точечные правки — вручную через `NASIBASHOP_*` в `.env` ([`.env.example`](.env.example)).
2. Сгенерируйте dev JWT и положите ключи рядом с Kong: из корня репозитория `npm run jwt:dev` (см. [dev-not-for-prod](services/api-gateway/declarative/dev-not-for-prod/README.md)).
3. Поднимите **всю инфраструктуру и микросервисы** одной командой:

   ```bash
   npm run dev:stack
   ```

   Скрипт [`scripts/dev-stack.cjs`](scripts/dev-stack.cjs) выставляет `KONG_DECLARATIVE_CONFIG_FILE` на [`kong.docker.yml`](services/api-gateway/declarative/kong.docker.yml) (маршруты на контейнеры) и запускает `docker compose -f docker-compose.yml -f docker-compose.services.yml up -d --build` (по умолчанию; можно передать другие подкоманды compose, см. комментарий в скрипте). Первый билд **Rust / Java / Go** может занять несколько минут.

   Остановить весь stack: `npm run dev:stack:down` · логи: `npm run dev:stack:logs` · список контейнеров: `npm run dev:stack:ps` · **только** Postgres, Redis, Kong… без микросервисов: `npm run docker:up` (эквивалент `docker compose up -d` по [`docker-compose.yml`](docker-compose.yml)).

4. API: Kong прокси по умолчанию **`http://localhost:8000`**, с профилем [nasibashop-nested-ports](environment/nasibashop-nested-ports.env) — **`http://localhost:18000`**. Админка/витрина отдельно: `cd frontends/storefront` → `npm install` → `npm run dev` с `NEXT_PUBLIC_API_URL`, совпадающим с Kong (см. раздел 5 и [frontends/storefront/.env.example](frontends/storefront/.env.example)).

**Вариант без сервисов в Docker:** поднять только зависимости — `docker compose up -d`, микросервисы вручную с хоста, Kong смотрит на `host.docker.internal` (см. [`kong.yml`](services/api-gateway/declarative/kong.yml)).

## Требования

- **Docker** + Docker Compose  
- **Node.js 20+** — `payment-service`, `notification-service`, фронты  
- **Go 1.22+** — user, product, delivery, media  
- **JDK 21+** — `order-service`  
- **Rust 1.88+** — `search-service` (и Docker-образ `rust:1.88-bookworm` в [Dockerfile](infrastructure/docker/search-service/Dockerfile))  

## 1. Инфраструктура (локально)

Из корня репозитория:

```bash
docker compose up -d
```

**VPS / занятые порты:** если на сервере уже слушают `6379`, `5432`, `8000` и т.д., скопируйте [`.env.example`](.env.example) в **`.env`**, задайте `NASIBASHOP_REDIS_PORT`, `NASIBASHOP_POSTGRES_PORT`, … (см. комментарии в файле). Микросервисы на хосте тогда укажите на те же порты (`REDIS_ADDR`, `DATABASE_URL`, `NEXT_PUBLIC_API_URL` для Kong).

Поднимаются: **PostgreSQL 16**, **Redis**, **Kafka** (KRaft, внешний порт `9094` с хоста, при [nested ports](environment/nasibashop-nested-ports.env) — `19094`), **Meilisearch**, **MongoDB 7**, **Consul**, **Kong** (прокси `8000` / `18000`, admin `8001` / `18001` в зависимости от `.env`, см. [`nasibashop-nested-ports.env`](environment/nasibashop-nested-ports.env)).

Базы для сервисов создаются скриптом `infrastructure/docker/postgres/init-multiple-databases.sh` при первом старте Postgres.

Подробнее: [`infrastructure/README.md`](infrastructure/README.md).

## 2. Миграции PostgreSQL

При старте **`npm run dev:stack`** контейнер `db-migrate` сам применяет `migrations/001_init.sql` и демо-сид к `user_service` / `product_service` (`002_seed_*.sql`), а также `001_init.sql` к `delivery_service`, `media_service` (см. [`scripts/migrate-in-docker.sh`](scripts/migrate-in-docker.sh)). **order-service** поднимает схему через Flyway, **payment-service** в dev через TypeORM (см. их README).

Вручную, без полного stack, для сервисов с SQL примените `migrations/` (команды в README соответствующего сервиса), например:

```bash
psql "postgres://nasiba:nasiba_dev_password@localhost:5432/user_service?sslmode=disable" -f services/user-service/migrations/001_init.sql
psql "postgres://nasiba:nasiba_dev_password@localhost:5432/user_service?sslmode=disable" -f services/user-service/migrations/002_seed_demo_users.sql
```

Аналогично: `product_service` (+ [`002_seed_demo_catalog.sql`](services/product-service/migrations/002_seed_demo_catalog.sql)), `order_service`, `payment_service`, `delivery_service`, `media_service`.

## 3. Порты сервисов (локально, за Kong)

| Сервис | Порт по умолчанию | Префикс через Kong (хост: `8000` или `18000` — см. `.env` / [nested-ports](environment/nasibashop-nested-ports.env)) |
|--------|-------------------|-------------------------------|
| user-service | 8080 | `/api/auth`, `/api/users` |
| product-service | 8083 | `/api/products`, `/api/categories` |
| order-service | 8081 | `/api/orders` |
| payment-service | 8082 | `/api/payments` |
| delivery-service | 8085 | `/api/delivery` |
| search-service | 8086 | `/api/search` |
| notification-service | 8087 | `/api/notifications`, `/ws/notifications`, `/socket.io` |
| media-service | 8088 | `/api/media` |

**Проверка готовности:** у большинства сервисов есть `GET /health/live` (процесс поднят) и `GET /health/ready` (зависимости: БД, Redis, **TCP к Kafka** (Go: user/product/delivery/media; Nest: **payment-service** — Postgres+Redis+Kafka, **notification-service** — Mongo+опционально Kafka при непустом `KAFKA_BROKERS`), **search-service** (Rust) — readiness по **Meilisearch** (`checks.meilisearch`); при сбое часто **503**). Ответы **Go**, **Nest** и **search-service** для `/health/ready` включают единообразное поле **`checks`** (например `postgres`/`UP`, `kafka`/`SKIPPED` если брокеры не заданы). **order-service** (Spring): `GET /actuator/health/readiness` — БД + Kafka (`KafkaClusterHealthIndicator`, бин `kafka`); см. [`services/order-service/README.md`](services/order-service/README.md). Для Go-сервисов **user / product / delivery / media** общая реализация — пакет [`packages/go-health`](packages/go-health/README.md). В `docker-compose.services.yml` для образов с shell заданы `healthcheck` (payment, notification, order, search, media); Go-сервисы на distroless проверяйте с хоста или через оркестратор.

Переменные окружения и точные команды запуска — в `services/<name>/README.md`.

## 4. API Gateway

Декларативный конфиг: [`services/api-gateway/declarative/kong.yml`](services/api-gateway/declarative/kong.yml).  
Upstream в режиме разработки указывает на `host.docker.internal` и порты из таблицы выше. На выбранных префиксах включена проверка **JWT RS256** (см. [`services/api-gateway/README.md`](services/api-gateway/README.md)); для SSR админки можно задать **`API_GATEWAY_JWT`** в `.env.local` (см. `frontends/admin-panel/.env.example`).

**OpenAPI** (контракт для клиентов через Kong): [`docs/api/gateway-openapi.yaml`](docs/api/gateway-openapi.yaml) — см. [`docs/api/README.md`](docs/api/README.md).

## 5. Фронтенды

| Приложение | Каталог | Порт dev (пример) |
|------------|---------|-------------------|
| Витрина | `frontends/storefront` | 3000 |
| Админка | `frontends/admin-panel` | 3001 |

**Оба сразу** (скрипт [`scripts/dev-frontends.cjs`](scripts/dev-frontends.cjs), **без** `concurrently`). Зависимости фронтов из корня: `npm run install:frontends`, затем:

```bash
# витрина :3000, админка :3001, Kong в .env.local — обычно http://localhost:8000
npm run dev:frontends
```

Если **порт 3000 занят** (другой Next) и витрина уходит на 3002 — либо освободите 3000, либо задайте перед командой `NASIBASHOP_STOREFRONT_DEV_PORT=3002` (Windows PowerShell: `$env:NASIBASHOP_STOREFRONT_DEV_PORT=3002`). Админка по умолчанию **3001**; другой порт: `NASIBASHOP_ADMIN_DEV_PORT`. Для `npm run start:frontends` порты прод-сборки: `NASIBASHOP_STOREFRONT_START_PORT`, `NASIBASHOP_ADMIN_START_PORT`. При смене порта витрины настройте **nginx** `location /` → `127.0.0.1:<порт>` и при необходимости `allowedDevOrigins` в `next.config`.

Прод (после `npm run build:frontends`):

```bash
npm run build:frontends
npm run start:frontends
```

По отдельности, как раньше:

```bash
cd frontends/storefront
cp .env.example .env.local   # NEXT_PUBLIC_API_URL — см. комментарии в .env.example
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
- **TypeScript типы:** [`packages/shared-types`](packages/shared-types) — подключён в **storefront** и **admin-panel** (`file:`). Проверка типов из корня: `npm run typecheck`.  
- **ESLint / Prettier / TSconfig:** [`packages/shared-config`](packages/shared-config) — базовый `tsconfig` для Next-приложений. Линт обоих фронтов из корня: `npm run lint:frontends`.

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
- **`kong config parse`** для [`kong.yml`](services/api-gateway/declarative/kong.yml) и [`kong.docker.yml`](services/api-gateway/declarative/kong.docker.yml) (образ `kong:3.7`).  

## 9. Полезные ссылки

- Техническое задание: [`.cursor/rules/ТЗ.mdc`](.cursor/rules/ТЗ.mdc)  
- **MVP production** (чеклист секретов, Kong, миграции, K8s): [`docs/MVP-PRODUCTION.md`](docs/MVP-PRODUCTION.md)  
- Docker-образы сервисов: `infrastructure/docker/*/Dockerfile`  
- Локальные JWT для Kong + user-service: `npm run jwt:dev` или `node scripts/generate-dev-jwt-keys.cjs` (см. [`services/api-gateway/declarative/dev-not-for-prod/README.md`](services/api-gateway/declarative/dev-not-for-prod/README.md))  
