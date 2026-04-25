# delivery-service (Helm)

Go-сервис: HTTP **8085**, health **`/health/live`**, **`/health/ready`**. Kong маршрутизирует `/api/delivery` с `strip_path: true` на префикс `/delivery` в контейнере.

## Secret

- `DATABASE_URL` — `postgres://user:pass@host:5432/delivery_service?sslmode=require`

```bash
kubectl create secret generic delivery-service-secrets \
  --namespace nasibashop \
  --from-literal=DATABASE_URL='postgres://nasiba:...@postgres:5432/delivery_service?sslmode=require'
```

## Установка

```bash
helm upgrade --install delivery-service infrastructure/kubernetes/delivery-service \
  --namespace nasibashop
```

Топики Kafka по умолчанию заданы в `values.yaml` (`env.kafkaTopic*`); при необходимости переопределите через `--set` или отдельный `values-prod.yaml`.
