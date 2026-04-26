# Storefront (Next.js 15)

Витрина для покупателей: мобильный интерфейс, акцент бренда `#7000FF`, **TanStack Query**, **Zustand** (корзина в `localStorage`), **Framer Motion**.

## Страницы

| Путь | Описание |
|------|----------|
| `/` | Главная, популярные товары, категории |
| `/catalog/[slug]` | Все товары (`barchasi`) или категория по `slug`; поиск `?q=`; пагинация `?page=` |
| `/product/[id]` | Карточка товара |
| `/cart` | Корзина |
| `/login`, `/register` | Вход и регистрация покупателя (email + пароль) → JWT в httpOnly-cookie |
| `/checkout` | Оформление (нужна сессия). Bearer: cookie, иначе `API_GATEWAY_JWT` |
| `/profile` | Личный кабинет (нужна сессия): заказы, профиль, адреса |
| `/profile/orders/[id]` | Детали заказа (`GET /api/orders/{id}`) |

Поиск в шапке на страницах `/catalog/...` отправляет запрос **в текущий раздел** (категория + `q`). На остальных маршрутах — в `/catalog/barchasi`.

## Запуск

Витрина + админка из корня репозитория: `npm run dev:frontends` (см. `scripts/dev-frontends.cjs`). Перед этим в каждом фронте выполните `npm install` или из корня `npm run install:frontends`.

Отдельно:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Обычно `http://localhost:3000`. API: Kong `NEXT_PUBLIC_API_URL` (например `http://localhost:8000` или `18000` с профилем nested ports).

Если `npm run dev` (Turbopack) снова ругается на `tsconfig`, запустите **`npm run dev:webpack`** — обычный бандлер Next без Turbopack.

## TypeScript

- **`@nasibashop/shared-types`** — общие DTO.
- **`tsconfig`** — базовые флаги совпадают с [`packages/shared-config/tsconfig.base.json`](../../packages/shared-config/tsconfig.base.json) (без `extends`, см. README пакета).

## Доступность и UX

- Ссылка **«К основному содержимому»** (первая при Tab), якорь `#site-main` на `<main>`.
- Видимый **`:focus-visible`** для ссылок, кнопок и полей ввода (`globals.css`).

## Сборка

```bash
npm run build
```
