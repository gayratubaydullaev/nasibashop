# Storefront (Next.js 15)

Xaridorlar uchun vitrina: **Uzum / Wildberries** uslubida binafsha aksent (`#7000FF`), mobil-first, **TanStack Query**, **Zustand** (savatcha), **Framer Motion**.

## Sahifalar

| Yo‘l | Tavsif |
|------|--------|
| `/` | Bosh sahifa, mashhur mahsulotlar, kategoriyalar |
| `/catalog/[slug]` | `barchasi` yoki kategoriya `slug` bo‘yicha; `?q=` qidiruv |
| `/product/[id]` | Mahsulot kartochkasi |
| `/cart` | Savatcha (localStorage) |
| `/checkout` | Buyurtma skeleti |
| `/profile` | Kabinet skeleti |
| `/profile/orders/[id]` | Buyurtma detali skeleti |

## Ishga tushirish

Bitta buyruq — vitrina + admin: ildizda `npm run dev:frontends` (`scripts/dev-frontends.cjs`, alohida paket shart emas; avvalo ikkala frontendda `npm install`).

Alohida:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Odatda `http://localhost:3000`. API: **Kong** `http://localhost:8000` (`NEXT_PUBLIC_API_URL`).

## TypeScript

- **`@nasibashop/shared-types`** (`file:../../packages/shared-types`) — DTOlar.
- **`tsconfig`** — [`packages/shared-config`](../../packages/shared-config) `tsconfig.base.json` dan `extends`.

## Build

```bash
npm run build
```
