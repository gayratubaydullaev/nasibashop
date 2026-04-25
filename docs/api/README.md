# API-документация (OpenAPI)

Агрегированное описание **публичного REST** (и части внутренних путей), как его видит клиент при обращении к **Kong** на `http://localhost:8000`.

## Файл

- [`gateway-openapi.yaml`](gateway-openapi.yaml) — OpenAPI **3.0.3**

Схемы и ответы упрощены: детальные DTO смотрите в коде сервисов и в их README.

## Просмотр (Swagger UI)

Из каталога `docs/api` (чтобы корректно смонтировать файл):

**Linux / macOS**

```bash
cd docs/api
docker run --rm -p 8089:8080 -e SWAGGER_JSON=/spec/gateway-openapi.yaml -v "$(pwd)/gateway-openapi.yaml:/spec/gateway-openapi.yaml" swaggerapi/swagger-ui
```

**Windows (PowerShell)**

```powershell
cd docs\api
docker run --rm -p 8089:8080 -e SWAGGER_JSON=/spec/gateway-openapi.yaml -v "${PWD}\gateway-openapi.yaml:/spec/gateway-openapi.yaml" swaggerapi/swagger-ui
```

Откройте `http://localhost:8089`.

Либо загрузите YAML в [Swagger Editor](https://editor.swagger.io/).

## Ограничения

- **Health** (`/health/live`, `/health/ready`) на сервисах обычно не проксируются через Kong — проверка напрямую по порту сервиса.
- **JWT**: на Kong включена **выборочная** RS256-валидация на части маршрутов; см. [`services/api-gateway/README.md`](../../services/api-gateway/README.md) и [`docs/MVP-PRODUCTION.md`](../MVP-PRODUCTION.md).
- **WebSocket** (Socket.IO) в OpenAPI описан минимально; клиент подключается к тому же хосту/порту, что и REST.
