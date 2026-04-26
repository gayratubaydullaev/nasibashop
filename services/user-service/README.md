# User Service

Go service responsible for users, authentication, roles, addresses, and login security history.

## Responsibilities

- Register and authenticate by email/password.
- Phone authentication placeholder for SMS providers. Local development accepts `000000` as SMS code.
- Issue RS256 JWT access tokens and Redis-backed refresh tokens.
- Manage user profile and delivery addresses.
- Publish Kafka events: `user.created`, `user.address.added`.

## REST API

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/validate`
- `GET /users/{id}`
- `PATCH /users/{id}`
- `GET /users/{id}/addresses` (тот же доступ, что у `POST …/addresses`: владелец или `SUPER_ADMIN`)
- `POST /users/{id}/addresses`
- `GET /health/live` — процесс жив (для liveness)
- `GET /health/ready` — **503** при недоступности Postgres, Redis или Kafka (TCP к `KAFKA_BROKERS`; пустой список брокеров — без проверки Kafka)

## Local Run

Start dependencies from the repository root:

```bash
docker compose up -d postgres redis kafka
```

Apply `migrations/001_init.sql`, затем опционально **`migrations/002_seed_demo_users.sql`** (аккаунты `admin@demo.local` / `manager@demo.local` / `customer@demo.local`, пароль **`Demo12345!`**).

```bash
go run ./cmd/server
```

Environment variables:

- `HTTP_PORT` defaults to `8080`.
- `DATABASE_URL` defaults to local compose PostgreSQL.
- `REDIS_ADDR` defaults to `localhost:6379`.
- `KAFKA_BROKERS` defaults to `localhost:9094`.
- `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are optional in local development; the service generates an ephemeral keypair if omitted. Alternatively, mount PEMs and set **`JWT_PRIVATE_KEY_FILE`** and **`JWT_PUBLIC_KEY_FILE`** to paths **inside the container** (the full Docker stack does this; see [root `docker-compose.services.yml`](../../docker-compose.services.yml)).
- **Kong JWT (dev):** to verify access tokens at the gateway, use the same PEM pair as in [`../api-gateway/declarative/dev-not-for-prod/README.md`](../api-gateway/declarative/dev-not-for-prod/README.md) and keep `JWT_ISSUER` default `nasibashop-user-service` (must match Kong consumer `key`).

## Роли для админки

Регистрация через витрину создаёт только `CUSTOMER`. Чтобы войти в **admin-panel** (`/login`), пользователю нужна роль `SUPER_ADMIN` или `STORE_MANAGER` в таблице `roles` (БД `user_service`). Демо-пользователи задаются сидом `002_seed_demo_users.sql`.

Подставьте UUID пользователя из `users` (по email):

```sql
INSERT INTO roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000000', 'SUPER_ADMIN')
ON CONFLICT (user_id, role) DO NOTHING;
```

После этого пользователь должен **выйти и снова войти** (или обновить токены), чтобы в JWT попали новые роли.
