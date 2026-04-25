import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogProducts, getCategories } from "@/lib/api/products";
import { findCategoryBySlug } from "@/lib/categories";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton";
import { Suspense } from "react";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
};

async function CatalogGrid({ slug, q }: { slug: string; q?: string }) {
  const categoriesRes = await getCategories();
  const tree = categoriesRes?.categories ?? [];
  const category = slug !== "barchasi" ? findCategoryBySlug(tree, slug) : undefined;

  if (slug !== "barchasi" && !category) {
    notFound();
  }

  const data = await getCatalogProducts({
    searchQuery: q?.trim() || undefined,
    categoryId: category?.id,
  });

  if (!data?.products?.length) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
        Bu bo‘limda mahsulot topilmadi.
      </p>
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

export default async function CatalogPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { q } = await searchParams;
  const categoriesRes = await getCategories();
  const category = slug !== "barchasi" ? findCategoryBySlug(categoriesRes?.categories ?? [], slug) : undefined;
  const title =
    slug === "barchasi" ? (q ? `Qidiruv: «${q}»` : "Barcha mahsulotlar") : category?.nameUz ?? "Katalog";

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-xs text-zinc-500">
          <Link href="/" className="hover:text-brand">
            Bosh sahifa
          </Link>
          <span className="mx-1">/</span>
          <span className="text-zinc-800">{title}</span>
        </nav>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">{title}</h1>
      </div>
      <Suspense key={`${slug}-${q ?? ""}`} fallback={<ProductGridSkeleton />}>
        <CatalogGrid slug={slug} q={q} />
      </Suspense>
    </div>
  );
}
