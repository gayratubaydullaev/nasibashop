# media-service (Helm)

Go: HTTP **8088**, fayllar **`emptyDir`** da `MEDIA_LOCAL_DIR` (standart **`/data/media`**). `readOnlyRootFilesystem: true` — yozish faqat shu tom.

## Secret

```bash
kubectl create secret generic media-service-secrets \
  --namespace nasibashop \
  --from-literal=DATABASE_URL='postgres://user:pass@postgres:5432/media_service?sslmode=require'
```

## Replikalar

Standart **`replicaCount: 1`**: har bir Pod alohida `emptyDir`, umumiy disk yo‘q. Bir nechta instans + bir xil fayllar uchun **S3/MinIO** (`MEDIA_S3_*`) ni `Deployment`ga qo‘lda qo‘shing yoki keyingi chart versiyasida kengaytiramiz.

## O‘rnatish

```bash
helm upgrade --install media-service infrastructure/kubernetes/media-service \
  --namespace nasibashop
```

Kong: `/api/media` → upstream `.../media`, `strip_path: true`.
