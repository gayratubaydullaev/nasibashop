# search-service (Rust + Actix-web)

Полнотекстовый поиск по каталогу через **Meilisearch**, индексация из **Kafka** (`product.created` / `product.updated` / `product.deleted`) с подтягиванием полной карточки товара по HTTP из **product-service**.

## Зависимости

- Meilisearch (см. корневой `docker-compose.yml`, порт `7700`, ключ по умолчанию `nasibashop_meili_dev_master_key`)
- `product-service` для `GET /products/{id}` и `GET /products?limit=&offset=`
- Kafka (опционально): без `KAFKA_BROKERS` consumer не стартует

## HTTP

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/health/live`, `/health/ready` | Liveness / readiness |
| GET | `/api/search` | Поиск: `q`, `category` (slug), `categoryId`, `minPrice`, `maxPrice`, `storeId`, `brand`, `inStockOnly`, `sort` (`price_asc`, `price_desc`, `created_at_desc`, `popularity_desc`), `limit`, `offset` |
| GET | `/api/search/suggest` | Подсказки: `q`, `limit` |
| POST | `/api/search/reindex` | Полная переиндексация (если задан `REINDEX_API_KEY` — заголовок `X-Admin-Key`) |

## Переменные окружения

| Переменная | По умолчанию |
|------------|----------------|
| `HTTP_PORT` | `8086` |
| `MEILI_URL` | `http://localhost:7700` |
| `MEILI_MASTER_KEY` | `nasibashop_meili_dev_master_key` |
| `MEILI_INDEX` | `products` |
| `PRODUCT_SERVICE_URL` | `http://127.0.0.1:8083` |
| `KAFKA_BROKERS` | `127.0.0.1:9094` |
| `REINDEX_API_KEY` | пусто = reindex без ключа (только для dev) |

## Сборка

Требуется **CMake** (для `rdkafka` с фичей `cmake-build`).

```bash
cd services/search-service
cargo build --release
```

## Docker

Из корня репозитория:

```bash
docker build -f infrastructure/docker/search-service/Dockerfile -t nasibashop/search-service:local .
```

## Kubernetes (Helm)

Чарт: [`infrastructure/kubernetes/search-service`](../../infrastructure/kubernetes/search-service/README.md).

## Синонимы

В индекс зашиты примеры для узбекского/русского/англ.: `telefon` ↔ `smartfon`, `mobil`, `мобильный`, `mobile` (настройка Meilisearch `synonyms`).
