# product-service (Helm)

Go-сервис каталога, только **HTTP** (порт **8083**). Секрет с `DATABASE_URL` обязателен.

## Установка

```bash
kubectl create secret generic product-service-secrets \
  --namespace nasibashop \
  --from-literal=DATABASE_URL='postgres://user:pass@postgres:5432/product_service?sslmode=require'

helm upgrade --install product-service infrastructure/kubernetes/product-service \
  --namespace nasibashop \
  --create-namespace
```

Образ: настройте `values.yaml` (`image.repository`, `image.tag`) под ваш registry.
