# order-service (Helm)

Spring Boot 3: JDBC, Kafka, Actuator (**liveness/readiness** на `/actuator/health/*`). HTTP **8081**.

## Секрет

Ключи должны совпадать с `application.yml`:

- `ORDER_SERVICE_DATABASE_URL` — JDBC URL (`jdbc:postgresql://...`)
- `ORDER_SERVICE_DATABASE_USER`
- `ORDER_SERVICE_DATABASE_PASSWORD`

```bash
kubectl create secret generic order-service-secrets \
  --namespace nasibashop \
  --from-literal=ORDER_SERVICE_DATABASE_URL='jdbc:postgresql://postgres:5432/order_service' \
  --from-literal=ORDER_SERVICE_DATABASE_USER='nasiba' \
  --from-literal=ORDER_SERVICE_DATABASE_PASSWORD='...'
```

## Установка

```bash
helm upgrade --install order-service infrastructure/kubernetes/order-service \
  --namespace nasibashop
```

`readOnlyRootFilesystem: false` — из‑за временных файлов JVM/Gradle в рантайме; для production ужесточайте образ и политику отдельно.
