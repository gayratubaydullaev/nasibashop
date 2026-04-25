# NasibaShop Infrastructure

This directory contains local and Kubernetes infrastructure for NasibaShop.

Полная инструкция по запуску всего стека (сервисы, Kong, фронты): корневой [`README.md`](../README.md).  
**MVP production:** [`docs/MVP-PRODUCTION.md`](../docs/MVP-PRODUCTION.md).

## Local Development

The root `docker-compose.yml` starts the minimum local dependencies:

- PostgreSQL 16
- Redis 7
- Kafka 3.7 in KRaft mode
- Meilisearch
- MongoDB 7 (for `notification-service`)
- Consul
- Kong 3.7 (`api-gateway`, proxy `localhost:8000`)

Frontends (alohida terminalda): `frontends/storefront` va `frontends/admin-panel` — `NEXT_PUBLIC_API_URL=http://localhost:8000`, `npm run dev` (admin uchun port ziddiyati bo‘lsa `-p 3001`).

```bash
docker compose up -d
```

Если Docker ругается на **«address already in use»** (часто **6379** или **5432**), в корне репозитория создайте **`.env`** по образцу [`.env.example`](../.env.example) и задайте `NASIBASHOP_REDIS_PORT`, `NASIBASHOP_POSTGRES_PORT` и при необходимости порты Kong / Kafka / остальное.

PostgreSQL creates one database per service on first startup through
`infrastructure/docker/postgres/init-multiple-databases.sh`.

**Полный бэкенд в Docker (одна команда из корня репозитория):** `npm run dev:stack` — см. [корневой README](../README.md) (файл `docker-compose.services.yml`).

Service images (examples): `infrastructure/docker/user-service/Dockerfile`,
`infrastructure/docker/order-service/Dockerfile`,
`infrastructure/docker/product-service/Dockerfile`,
`infrastructure/docker/payment-service/Dockerfile`,
`infrastructure/docker/delivery-service/Dockerfile`,
`infrastructure/docker/search-service/Dockerfile`,
`infrastructure/docker/notification-service/Dockerfile`,
`infrastructure/docker/media-service/Dockerfile`,
`infrastructure/docker/api-gateway/Dockerfile`.

## Helm Charts

- **`kubernetes/user-service`** — эталонный чарт (HTTP + gRPC, JWT, Redis).
- **`kubernetes/product-service`** — Go, HTTP 8083; [README](kubernetes/product-service/README.md).
- **`kubernetes/order-service`** — Spring Boot, HTTP 8081, Actuator probes; [README](kubernetes/order-service/README.md).
- **`kubernetes/payment-service`** — NestJS, HTTP 8082, probes `/health/*`; [README](kubernetes/payment-service/README.md).
- **`kubernetes/delivery-service`** — Go, HTTP 8085, probes `/health/*`; [README](kubernetes/delivery-service/README.md).
- **`kubernetes/search-service`** — Rust, HTTP 8086, Meilisearch + Kafka; [README](kubernetes/search-service/README.md).
- **`kubernetes/notification-service`** — NestJS, HTTP 8087, MongoDB + Kafka; [README](kubernetes/notification-service/README.md).
- **`kubernetes/media-service`** — Go, HTTP 8088, Postgres + локальный том (`emptyDir`); [README](kubernetes/media-service/README.md).
- **`kubernetes/api-gateway`** — Kong 3.7 DB-less, declarative из values (upstream в кластере); [README](kubernetes/api-gateway/README.md).

```bash
helm upgrade --install user-service infrastructure/kubernetes/user-service \
  --namespace nasibashop \
  --create-namespace

helm upgrade --install product-service infrastructure/kubernetes/product-service \
  --namespace nasibashop

helm upgrade --install order-service infrastructure/kubernetes/order-service \
  --namespace nasibashop

helm upgrade --install payment-service infrastructure/kubernetes/payment-service \
  --namespace nasibashop

helm upgrade --install delivery-service infrastructure/kubernetes/delivery-service \
  --namespace nasibashop

helm upgrade --install search-service infrastructure/kubernetes/search-service \
  --namespace nasibashop

helm upgrade --install notification-service infrastructure/kubernetes/notification-service \
  --namespace nasibashop

helm upgrade --install media-service infrastructure/kubernetes/media-service \
  --namespace nasibashop

helm upgrade --install api-gateway infrastructure/kubernetes/api-gateway \
  --namespace nasibashop
```

Before installing, create the secret expected by the chart:

```bash
kubectl create secret generic user-service-secrets \
  --namespace nasibashop \
  --from-literal=DATABASE_URL='postgres://user:password@postgres:5432/user_service?sslmode=require' \
  --from-file=JWT_PUBLIC_KEY=./jwt-public.pem \
  --from-file=JWT_PRIVATE_KEY=./jwt-private.pem

kubectl create secret generic product-service-secrets \
  --namespace nasibashop \
  --from-literal=DATABASE_URL='postgres://user:password@postgres:5432/product_service?sslmode=require'

kubectl create secret generic order-service-secrets \
  --namespace nasibashop \
  --from-literal=ORDER_SERVICE_DATABASE_URL='jdbc:postgresql://postgres:5432/order_service' \
  --from-literal=ORDER_SERVICE_DATABASE_USER='nasiba' \
  --from-literal=ORDER_SERVICE_DATABASE_PASSWORD='password'

kubectl create secret generic payment-service-secrets \
  --namespace nasibashop \
  --from-literal=DATABASE_URL='postgres://user:password@postgres:5432/payment_service?sslmode=require'

kubectl create secret generic delivery-service-secrets \
  --namespace nasibashop \
  --from-literal=DATABASE_URL='postgres://user:password@postgres:5432/delivery_service?sslmode=require'

kubectl create secret generic search-service-secrets \
  --namespace nasibashop \
  --from-literal=MEILI_MASTER_KEY='same-as-meilisearch-master-key'

kubectl create secret generic notification-service-secrets \
  --namespace nasibashop \
  --from-literal=MONGODB_URI='mongodb://user:password@mongo:27017/notification_service?authSource=admin'

kubectl create secret generic media-service-secrets \
  --namespace nasibashop \
  --from-literal=DATABASE_URL='postgres://user:password@postgres:5432/media_service?sslmode=require'
```

Перед `search-service` убедитесь, что в кластере доступны **Meilisearch** и **product-service**; URLы в `values.yaml` (`env.meiliUrl`, `env.productServiceUrl`) при необходимости замените на FQDN вашего namespace.

## AWS EKS Terraform

`terraform/aws-eks` creates:

- VPC with public and private subnets
- Internet Gateway and NAT Gateway
- EKS control plane
- EKS managed node group
- IAM roles and managed policy attachments

```bash
cd infrastructure/terraform/aws-eks
terraform init
terraform plan
terraform apply
```

After apply:

```bash
aws eks update-kubeconfig --region eu-central-1 --name nasibashop-dev
```

Production hardening should add remote state, private-only API access,
cluster add-ons, Vault, Istio, ArgoCD, Prometheus, Grafana, Jaeger, and ELK.
