import Link from "next/link";
import { getFeaturedProducts, getCategories } from "@/lib/api/products";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton";
import { flattenCategories } from "@/lib/categories";
import { Suspense } from "react";

async function FeaturedSection() {
  const data = await getFeaturedProducts();
  if (!data?.products?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600 shadow-card">
        <p>Пока нет товаров или не настроен API.</p>
        <p className="mt-2 text-xs text-zinc-500">
          Запустите product-service и Kong, задайте NEXT_PUBLIC_API_URL в .env.local.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {data.products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}

async function CategoryChips() {
  const res = await getCategories();
  const flat = res?.categories ? flattenCategories(res.categories).slice(0, 8) : [];
  if (!flat.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {flat.map((c) => (
        <Link
          key={c.id}
          href={`/catalog/${c.slug}`}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-brand hover:text-brand"
        >
          {c.nameUz}
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-violet-600 to-fuchsia-600 p-5 text-white shadow-card sm:rounded-3xl sm:p-10">
        <p className="text-xs font-medium uppercase tracking-wide text-white/80 sm:text-sm">Новая коллекция</p>
        <h1 className="mt-2 max-w-xl text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
          Современные покупки в духе маркетплейсов
        </h1>
        <p className="mt-4 max-w-lg text-sm text-white/90 sm:text-base">
          Быстрая доставка, акции и удобная оплата — всё в одном месте.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/catalog/barchasi"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-brand shadow-lg transition hover:bg-zinc-50"
          >
            В каталог
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
          >
            Корзина
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">Популярные товары</h2>
          <Link href="/catalog/barchasi" className="text-sm font-medium text-brand hover:underline">
            Смотреть все
          </Link>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <FeaturedSection />
        </Suspense>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">Категории</h2>
        <Suspense fallback={<div className="h-10 animate-pulse rounded-2xl bg-zinc-200" />}>
          <CategoryChips />
        </Suspense>
      </section>
    </div>
  );
}
