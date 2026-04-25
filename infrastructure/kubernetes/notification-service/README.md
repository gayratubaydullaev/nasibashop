# notification-service (Helm)

NestJS: HTTP **8087**, Socket.IO shu portda. Health: **`/health/live`**, **`/health/ready`**. Kong: `/api/notifications`, `/ws/notifications`, `/socket.io`.

## Secret

```bash
kubectl create secret generic notification-service-secrets \
  --namespace nasibashop \
  --from-literal=MONGODB_URI='mongodb://user:pass@mongo:27017/notification_service?authSource=admin'
```

## O‘rnatish

```bash
helm upgrade --install notification-service infrastructure/kubernetes/notification-service \
  --namespace nasibashop
```

Ingress yoki mesh orqali WebSocket yo‘llarini Kong bilan moslang (timeout va `Connection: Upgrade`).
