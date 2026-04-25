# Admin panel (Next.js 15)

**SUPER_ADMIN** va **STORE_MANAGER** rollari uchun alohida bo‘limlar (ТЗ).

## Yo‘llar

| Roll | Yo‘llar |
|------|---------|
| Super admin | `/admin`, `/admin/orders` (barcha yoki `?storeId=`, `?status=`), `/admin/products`, `/admin/stores`, `/admin/users` |
| Store manager | `/store`, `/store/products`, `/store/orders` (`NEXT_PUBLIC_STORE_ID` yoki `?storeId=`, `?status=`) |

Bosh sahifa: `/` — rollarni tanlash havolalari.

## Texnik

- **`@nasibashop/shared-types`** — mahsulot/kategoriya DTOlari (`types/index.ts`, `file:../../packages/shared-types`).
- **`tsconfig`** — `extends` orqali [`packages/shared-config`](../../packages/shared-config) bazasi.
- **`lib/api/fetch-json.ts`** — Kong orqali SSR; ixtiyoriy **`API_GATEWAY_JWT`** (`.env.example`).
- **Buyurtmalar** — jadvalda `PATCH /api/orders/{id}/status` (Server Action); Kong JWT yoqilgan bo‘lsa JWT majburiy.

## Ishga tushirish

```bash
cp .env.example .env.local
npm install
npm run dev
```

Port odatda `3000`; ikkinchi terminalda vitrina bilan ziddiyat bo‘lsa: `npm run dev -- -p 3001`.

## Build

```bash
npm run build
```
