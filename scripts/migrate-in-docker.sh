#!/bin/sh
# Применяет migrations/*.sql к сервисным БД: 001_init + демо-сид user/product (002_*).
# Контекст: образ postgres:alpine, PGHOST=postgres, каталог /work — монтирован services/.
set -e
export PGPASSWORD="${PGPASSWORD:-nasiba_dev_password}"
run_sql() {
  db=$1
  file=$2
  if [ -f "$file" ]; then
    echo "migrate: $db <- $file"
    psql -U nasiba -d "$db" -h "$PGHOST" -v ON_ERROR_STOP=1 -f "$file"
  else
    echo "migrate: skip (no file) $file"
  fi
}

run_sql "user_service" /work/user-service/migrations/001_init.sql
run_sql "user_service" /work/user-service/migrations/002_seed_demo_users.sql
run_sql "product_service" /work/product-service/migrations/001_init.sql
run_sql "product_service" /work/product-service/migrations/002_seed_demo_catalog.sql
run_sql "delivery_service" /work/delivery-service/migrations/001_init.sql
run_sql "media_service" /work/media-service/migrations/001_init.sql
echo "migrate: done"
