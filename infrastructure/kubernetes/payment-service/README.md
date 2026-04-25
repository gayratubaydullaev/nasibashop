# payment-service (Helm)

NestJS + TypeORM: HTTP **8082**, health checks **`/health/live`** va **`/health/ready`** (global prefix `/api` dan tashqari).

## Secret

TypeORM uchun bitta kalit:

- `DATABASE_URL` — `postgres://user:pass@host:5432/payment_service?sslmode=require`

```bash
kubectl create secret generic payment-service-secrets \
  --namespace nasibashop \
  --from-literal=DATABASE_URL='postgres://nasiba:...@postgres:5432/payment_service?sslmode=require'
```

Redis va Kafka manzillari `values.yaml` ichidagi `env.redisHost`, `env.redisPort`, `env.kafkaBrokers` orqali beriladi (zarurat bo‘lsa alohida Secret qo‘shing).

**Production:** `env.nodeEnv: production`, `env.paymentAutoComplete: "false"` (avtomatik to‘lovni o‘chirish).

## O‘rnatish

```bash
helm upgrade --install payment-service infrastructure/kubernetes/payment-service \
  --namespace nasibashop
```

`readOnlyRootFilesystem: false` — Nest/Node modullar va vaqtinchalik fayllar uchun; production uchun образни қатъийлаштириш тавсия этилади.
