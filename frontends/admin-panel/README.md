# Admin panel (Next.js 15)

Разделы для ролей **SUPER_ADMIN** и **STORE_MANAGER** (см. ТЗ).

## Маршруты

| Роль | Пути |
|------|------|
| Супер-админ | `/admin`, `/admin/orders`, `/admin/payments`, `/admin/products` (`?page=`), **`/admin/products/create`**, **`/admin/products/[id]`** (редактирование), `/admin/stores`, `/admin/users` |
| Менеджер магазина | `/store`, `/store/products` (`?page=`), **`/store/products/create`**, **`/store/products/[id]`**, `/store/orders` (`NEXT_PUBLIC_STORE_ID` или `?storeId=`) |

Меню продавца (`/store`): в сайдбаре группы **Обзор** / **Продажи** / **Каталог** (товары + отдельный пункт «Новый товар»); внизу подсказка по `NEXT_PUBLIC_STORE_ID`, если переменная не задана.

Стартовая страница `/` — при активной сессии редирект в `/admin` или `/store`. Вход: **`/login`** (email + пароль, роли `SUPER_ADMIN` / `STORE_MANAGER`). Защита `/admin/*` и `/store/*` — `middleware.ts` + JWT в cookie.

**Дополнительная защита URL панели:** если заданы **`ADMIN_PANEL_HTTP_BASIC_USER`** и **`ADMIN_PANEL_HTTP_BASIC_PASSWORD`**, браузер сначала запросит HTTP Basic (realm «NasibaShop Admin») для `/`, `/login`, `/admin/*`, `/store/*` — это отдельная пара учётных данных от аккаунта в user-service. В продакшене используйте только по **HTTPS**, иначе учётные данные можно перехватить.

## Техника

- **`@nasibashop/shared-types`** — DTO товаров/категорий (`types/index.ts`, `file:../../packages/shared-types`).
- **`tsconfig`** — те же базовые флаги, что в [`packages/shared-config/tsconfig.base.json`](../../packages/shared-config/tsconfig.base.json) (без `extends`, совместимость с Turbopack).
- **`lib/api/fetch-json.ts`** — запросы к Kong: сначала **`nasiba_access`** из cookie, иначе **`API_GATEWAY_JWT`**.
- **Заказы** — в таблице `PATCH /api/orders/{id}/status` (Server Action); при JWT на Kong токен обязателен.
- **Товары** — создание `POST /api/products` (несколько вариантов SKU в одной форме, до 20), правка `PATCH /api/products/{id}` (Server Actions); JWT на префиксе `/api/products` в Kong не включён (dev).
- **Остатки** — на странице редактирования товара блок «Остатки по складам»: `PATCH /api/products/{id}/stock` с телом `{ variantId, storeId, quantity }` (тот же `API_GATEWAY_JWT`, если Kong требует JWT на этом пути).

## Запуск

```bash
cp .env.example .env.local
npm install
npm run dev
```

Обычно порт `3001` при `npm run dev:frontends` из корня; отдельно: `npm run dev -- --port 3001`. При проблемах Turbopack с `tsconfig`: **`npm run dev:webpack`**.

## Сборка

```bash
npm run build
```
