# notification-service (NestJS)

Xabarnomalar: **MongoDB** (tarix), **Socket.IO** (real-time), **Kafka** (buyurtma/to‘lov hodisalari), email/SMS/FCM — **dev stub** (log + env tayyor).

## WebSocket

Namespace: **`/ws/notifications`** (asosiy HTTP port bilan bir xil host, masalan `http://localhost:8087`).

```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:8087/ws/notifications');
socket.emit('join', { userId: 'USER_ID', storeId: 'STORE_ID' });
socket.on('notification', (msg) => console.log(msg));
```

## REST (`/api` prefiksi)

| Metod | Yo‘l | Tavsif |
|--------|------|--------|
| GET | `/api/notifications/history?userId=&storeId=&limit=&offset=` | Mongo tarix |
| POST | `/api/notifications/send` | Ichki yuborish (`title`, `body`, ixtiyoriy `userId`, `storeId`, `topic`, `channels`) |

Health: `/health/live`, `/health/ready` (global `api` dan tashqari).

## Kafka

Guruh: `notification-service`. Topiklar (env bilan almashtirish mumkin):

- `order.created`, `order.status.changed`, `payment.completed`
- qo‘shimcha: `order.confirmed`, `order.cancelled`

Xabarlar `orderId`, `userId`, `storeId` va hokazo JSON maydonlariga asoslangan qisqa O‘zbek matn yaratiladi va WS orqali yuboriladi.

## Env

| O‘zgaruvchi | Default |
|-------------|---------|
| `PORT` | `8087` |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/notification_service` |
| `KAFKA_BROKERS` | `127.0.0.1:9094` (bo‘sh — consumer o‘chadi) |
| `KAFKA_CLIENT_ID` | `notification-service` |
| `KAFKA_GROUP_ID` | `notification-service` |
| `SMTP_HOST`, `FIREBASE_SERVICE_ACCOUNT_JSON` | stub uchun ixtiyoriy |

## Ishga tushirish

```bash
docker compose up -d mongo kafka   # lokal
cd services/notification-service
npm install
npm run start:dev
```

## Docker

Repozitoriy ildizidan:

```bash
docker build -f infrastructure/docker/notification-service/Dockerfile -t nasibashop/notification-service:local .
```

## Kubernetes (Helm)

Чарт: [`infrastructure/kubernetes/notification-service`](../../infrastructure/kubernetes/notification-service/README.md).
