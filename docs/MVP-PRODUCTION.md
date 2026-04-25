# NasibaShop: MVP production

Чеклист для **минимально жизнеспособного production** (без полного ТЗ: Istio, Vault, ELK и т.д.). Цель — безопасный деплой, предсказуемые секреты и отключённые dev-режимы.

## 1. Секреты и ключи

| Область | Требование |
|---------|------------|
| **Postgres** | Отдельный URL на сервис; `sslmode` не `disable` в prod. |
| **JWT** | Своя RS256-пара; **приватный ключ не в git**. Kong consumer `key` = `JWT_ISSUER` (по умолчанию `nasibashop-user-service`). |
| **Kong** | В `kong.yml` (или шаблоне Helm) подставить **public** PEM; приватный только в user-service (Secret / env). |
| **Meilisearch** | `MEILI_MASTER_KEY` в Secret; тот же ключ в `search-service` Secret. |
| **Admin SSR** | `API_GATEWAY_JWT` — временный костыль; для prod лучше BFF с cookie-сессией или OIDC. |

Локально после клона: `npm run jwt:dev` (из корня) или `node scripts/generate-dev-jwt-keys.cjs` — создаёт `jwt_dev_private.pem` (не коммитится), `jwt_dev_public.pem` и обновляет `kong.yml`.

## 2. Миграции и схема БД

- Применить SQL/миграции для **всех** БД сервисов до старта приложений.
- **order-service**: `spring.jpa.hibernate.ddl-auto=validate` (уже по умолчанию).
- **payment-service**: `TYPEORM_SYNC` в prod **не включать**; при `NODE_ENV=production` синхронизация схемы **принудительно выключена** в коде.
- **Docker-образ payment-service** уже задаёт `NODE_ENV=production`.

## 3. Платежи (dev → prod)

- В Kubernetes Helm для **payment-service** заданы `NODE_ENV=production` и **`PAYMENT_AUTO_COMPLETE=false`** (нет автозавершения платежей).
- Реальные URL и ключи Payme / Click / Uzcard — только из Secret; webhook-пути в Kong без JWT.

## 4. API Gateway (Kong)

В **GitHub Actions** конфиг проверяется командой `kong config parse` (образ `kong:3.7`) — см. `.github/workflows/ci.yml`, job `kong-declarative`.

- Сузить **CORS** `origins` до реальных доменов витрины и админки.
- Upstream: DNS сервисов в кластере вместо `host.docker.internal`.
- Лимиты: глобально по IP; на защищённых маршрутах — по consumer (см. текущий `kong.yml`).
- Логи: корреляция через `X-Request-Id`; централизованный сбор — отдельный этап (Loki/ELK).

## 5. Kubernetes

- Установить чарты в нужном порядке: инфраструктура (Postgres, Redis, Kafka, Meili, Mongo) → сервисы → **api-gateway** (Kong; см. `infrastructure/kubernetes/api-gateway`).
- Проверить **probes** и ресурсы; для **media-service** при нескольких репликах — S3/MinIO, не только `emptyDir`.
- Образы: теги по digest или semver, не `:latest` в prod.

## 6. Фронты (Next.js)

- Сборка: `NEXT_PUBLIC_API_URL` на боевой Kong/ingress.
- Не класть **секреты** в `NEXT_PUBLIC_*`. `API_GATEWAY_JWT` — только если осознанно принимаете риск; иначе — свой auth-слой.
- Включить **строгие** заголовки безопасности на reverse-proxy (ingress).

## 7. Что сознательно вне MVP

- mTLS / Istio, Vault, ArgoCD, Prometheus/Grafana/Jaeger как готовые стеки — планируются отдельно.
- Повторная валидация JWT в **каждом** микросервисе — поэтапно (сейчас упор на Kong + user-service).

## 8. Быстрая проверка после деплоя

1. Health: каждый сервис `/health/live` (и свои readiness, где есть).
2. `GET /api/products` через Kong без JWT.
3. `GET /api/users/{id}` с валидным Bearer — 200; без токена — 401.
4. Создание заказа и коллбеки оплаты (тестовая среда провайдера).

Подробности по портам и переменным: корневой [`README.md`](../README.md), [`infrastructure/README.md`](../infrastructure/README.md), README сервисов.
