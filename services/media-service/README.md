# media-service (Go)

Загрузка и отдача изображений: локальная папка или **S3-совместимое** хранилище (MinIO SDK), метаданные в PostgreSQL, события **Kafka** `media.uploaded` / `media.processed`.

## HTTP (порт `8088` по умолчанию)

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/health/live`, `/health/ready` | Проверки |
| POST | `/media/upload` | Multipart, поле `file` |
| GET | `/media/{id}` | Оригинал или трансформация: `?width=&height=&format=jpeg\|png\|webp` |
| DELETE | `/media/{id}` | Удаление из БД и хранилища |

## Kafka

- **Публикация:** `media.uploaded` (после записи), `media.processed` (заглушка вариантов: `["original"]`).

## База данных

БД `media_service` создаётся скриптом Postgres в корневом `docker-compose`. Примените миграцию:

```bash
psql "postgres://nasiba:nasiba_dev_password@localhost:5432/media_service?sslmode=disable" -f migrations/001_init.sql
```

## Переменные окружения

- `HTTP_PORT` (8088)
- `DATABASE_URL`
- `KAFKA_BROKERS` (через запятую; пусто — публикации пропускаются с предупреждением в логе)
- `KAFKA_TOPIC_MEDIA_UPLOADED`, `KAFKA_TOPIC_MEDIA_PROCESSED`
- `MEDIA_LOCAL_DIR` — каталог для локального режима (по умолчанию `./data/media`)
- `MEDIA_MAX_UPLOAD_BYTES` (по умолчанию 32 MiB)
- S3/MinIO (если заданы все четыре — используется объектное хранилище вместо локального каталога):
  - `MEDIA_S3_ENDPOINT` (например `http://minio:9000`)
  - `MEDIA_S3_BUCKET`
  - `MEDIA_S3_ACCESS_KEY`, `MEDIA_S3_SECRET_KEY`
  - `MEDIA_S3_REGION` (по умолчанию `auto`)
  - `MEDIA_S3_USE_PATH_STYLE` (`true` / `1` для path-style, типично для MinIO)

## Сборка

Из корня репозитория (контекст — `.`):

```bash
docker build -f infrastructure/docker/media-service/Dockerfile -t nasibashop/media-service:dev .
```

Локально: для выдачи **`format=webp`** нужен **libwebp** и **CGO** (пакет `github.com/chai2010/webp`).  
Ubuntu/Debian: `sudo apt install -y build-essential libwebp-dev` · затем `CGO_ENABLED=1` (значение по умолчанию в Linux).

```bash
cd services/media-service
go mod tidy
go build -o media-service ./cmd/server
```

## Kubernetes (Helm)

Чарт: [`infrastructure/kubernetes/media-service`](../../infrastructure/kubernetes/media-service/README.md).
