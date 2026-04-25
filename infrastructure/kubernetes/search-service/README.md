# search-service (Helm)

Rust (Actix): HTTP **8086**, Meilisearch va **product-service** URLlari `values.yaml` orqali. Kong: `/api/search` (`strip_path: false`).

## Secret

Meilisearch **master key** (K8s ichidagi Meili bilan bir xil bo‘lishi kerak):

```bash
kubectl create secret generic search-service-secrets \
  --namespace nasibashop \
  --from-literal=MEILI_MASTER_KEY='your-meili-master-key'
```

Ixtiyoriy `POST /api/search/reindex` himoyi: secretga `REINDEX_API_KEY` qo‘shing va `values.yaml` da `secrets.reindexApiKeyKey: REINDEX_API_KEY` deb yozing (bo‘sh qoldirilsa, chart bu o‘zgaruvchini qo‘shmaydi).

## O‘rnatish

`values.yaml` ichida `env.meiliUrl`, `env.productServiceUrl`, `env.kafkaBrokers` ni klasteringizga moslang (masalan, boshqa namespace — to‘liq FQDN).

```bash
helm upgrade --install search-service infrastructure/kubernetes/search-service \
  --namespace nasibashop
```
