import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogProducts, getCategories } from "@/lib/api/products";
import { findCategoryBySlug } from "@/lib/categories";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton";
import { CatalogPagination, CATALOG_PAGE_SIZE } from "@/components/catalog/catalog-pagination";
import { Suspense } from "react";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

function parseCatalogPage(raw: string | undefined): number {
  const n = parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

async function CatalogGrid({
  slug,
  q,
  page,
  categoryId,
}: {
  slug: string;
  q?: string;
  page: number;
  categoryId?: string;
}) {
  const offset = (page - 1) * CATALOG_PAGE_SIZE;
  const data = await getCatalogProducts({
    searchQuery: q?.trim() || undefined,
    categoryId,
    limit: CATALOG_PAGE_SIZE,
    offset,
  });

  if (data == null) {
    return (
      <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-900">
        Не удалось загрузить каталог. Проверьте Kong и <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_API_URL</code>.
      </p>
    );
  }

  const total = data.pagination?.totalCount ?? 0;

  if (!data.products.length) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
        В этом разделе пока нет товаров.
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-zinc-500">
        Показано {offset + 1}–{offset + data.products.length} из {total}
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {data.products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
      <CatalogPagination slug={slug} currentPage={page} totalCount={total} searchQuery={q} />
    </>
  );
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { q, page: pageRaw } = await searchParams;
  const page = parseCatalogPage(pageRaw);

  const categoriesRes = await getCategories();
  const tree = categoriesRes?.categories ?? [];
  const category = slug !== "barchasi" ? findCategoryBySlug(tree, slug) : undefined;

  if (slug !== "barchasi" && !category) {
    notFound();
  }

  const title =
    slug === "barchasi" ? (q?.trim() ? `Поиск: «${q.trim()}»` : "Все товары") : category?.nameUz ?? "Каталог";

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex flex-wrap items-center gap-x-1 text-xs text-zinc-500" aria-label="Хлебные крошки">
          <Link href="/" className="hover:text-brand">
            Главная
          </Link>
          <span aria-hidden className="text-zinc-400">
            /
          </span>
          {slug !== "barchasi" ? (
            <>
              <Link href="/catalog/barchasi" className="hover:text-brand">
                Каталог
              </Link>
              <span aria-hidden className="text-zinc-400">
                /
              </span>
            </>
          ) : null}
          <span className="font-medium text-zinc-800">{title}</span>
        </nav>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">{title}</h1>
      </div>
      <Suspense key={`${slug}-${q ?? ""}-${page}`} fallback={<ProductGridSkeleton />}>
        <CatalogGrid slug={slug} q={q} page={page} categoryId={category?.id} />
      </Suspense>
    </div>
  );
}
