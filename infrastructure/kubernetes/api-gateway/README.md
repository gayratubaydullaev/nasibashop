# api-gateway (Kong)

Helm-чарт поднимает **Kong 3.7** в режиме **DB-less** с declarative `kong.yml`, собранным из `values.yaml` (upstream-хосты, CORS, публичный JWT-ключ).

## Отличие от `services/api-gateway/declarative/kong.yml`

- Файл в репозитории ориентирован на **docker-compose** (`host.docker.internal`).
- Чарт генерирует конфиг с **in-cluster DNS** (`user-service:8080`, …) по умолчанию.

Перед production: задайте **`jwt.rsaPublicKey`**, **`cors.origins`** и при необходимости **`upstreams.*`** (FQDN, другой namespace через `host.namespace.svc.cluster.local`).

## Установка

```bash
helm upgrade --install api-gateway infrastructure/kubernetes/api-gateway \
  --namespace nasibashop \
  --create-namespace
```

Для отладки Admin API внутри кластера:

```bash
helm upgrade --install api-gateway infrastructure/kubernetes/api-gateway \
  --namespace nasibashop \
  --set admin.enabled=true
```

## Проверка конфига локально

Из корня репозитория (нужен Docker):

```bash
helm template test infrastructure/kubernetes/api-gateway >/tmp/api-gateway.yaml
# извлеките data.kong.yml в файл и выполните:
docker run --rm -v "$PWD/tmp-kong.yml:/kong/kong.yml:ro" kong:3.7 kong config parse /kong/kong.yml
```

В CI конфиг репозитория `services/api-gateway/declarative/kong.yml` проверяется job **`kong-declarative`**.
