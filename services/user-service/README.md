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
- `POST /users/{id}/addresses`
- `GET /health/live`
- `GET /health/ready`

## Local Run

Start dependencies from the repository root:

```bash
docker compose up -d postgres redis kafka
```

Apply the migration in `migrations/001_init.sql` to the `user_service` database.

```bash
go run ./cmd/server
```

Environment variables:

- `HTTP_PORT` defaults to `8080`.
- `DATABASE_URL` defaults to local compose PostgreSQL.
- `REDIS_ADDR` defaults to `localhost:6379`.
- `KAFKA_BROKERS` defaults to `localhost:9094`.
- `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are optional in local development; the service generates an ephemeral keypair if omitted.
  **Kong JWT (dev):** to verify access tokens at the gateway, use the same PEM pair as in [`../api-gateway/declarative/dev-not-for-prod/README.md`](../api-gateway/declarative/dev-not-for-prod/README.md) and keep `JWT_ISSUER` default `nasibashop-user-service` (must match Kong consumer `key`).
