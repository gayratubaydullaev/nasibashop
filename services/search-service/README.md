# search-service (Rust + Actix-web)

Полнотекстовый поиск по каталогу через **Meilisearch**, индексация из **Kafka** (`product.created` / `product.updated` / `product.deleted`) с подтягиванием полной карточки товара по HTTP из **product-service**.

## Зависимости

- Meilisearch (см. корневой `docker-compose.yml`, порт `7700`, ключ по умолчанию `nasibashop_meili_dev_master_key`)
- `product-service` для `GET /products/{id}` и `GET /products?limit=&offset=`
- Kafka (опционально): без `KAFKA_BROKERS` consumer не стартует

## HTTP

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/health/live` | Liveness |
| GET | `/health/ready` | Readiness: **200** `{"status":"ok","checks":{"meilisearch":"UP"}}` (Meili `GET /health`). Kafka-индексатор в фоне — в readiness **не входит**. **503** при недоступном Meili: `component`, `checks`, `detail` |
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

Требуется **Rust ≥ 1.88** (зависимости: Actix, transitive crates с `edition 2021`+), **CMake** (для `rdkafka` с фичей `cmake-build`). В **Ubuntu/Debian** при сборке `librdkafka` через `rdkafka-sys` нужен заголовок `curl` — пакет **`libcurl4-openssl-dev`** (и обычно `pkg-config`, `libssl-dev`, `libsasl2-dev`; см. CI).

Рекомендуется коммитить **`Cargo.lock`**, чтобы Docker и CI собирали один и тот же набор версий: `cargo generate-lockfile` или `cargo build` локально, затем `git add Cargo.lock`.

```bash
cd services/search-service
cargo build --release
```

**Docker** (`infrastructure/docker/search-service/Dockerfile`) использует образ **`rust:1.88-bookworm`**; без `Cargo.lock` при каждом билде `cargo` может взять более новые минорные версии — снова понадобится свежий компилятор, если пакет поднимет MSRV.

## Docker

Из корня репозитория:

```bash
docker build -f infrastructure/docker/search-service/Dockerfile -t nasibashop/search-service:local .
```

## Kubernetes (Helm)

Чарт: [`infrastructure/kubernetes/search-service`](../../infrastructure/kubernetes/search-service/README.md).

## Синонимы

В индекс зашиты примеры для узбекского/русского/англ.: `telefon` ↔ `smartfon`, `mobil`, `мобильный`, `mobile` (настройка Meilisearch `synonyms`).
