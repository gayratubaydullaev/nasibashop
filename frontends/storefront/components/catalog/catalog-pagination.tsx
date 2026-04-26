import Link from "next/link";
import { buildCatalogHref } from "@/lib/catalog-url";

export const CATALOG_PAGE_SIZE = 24;

type Props = {
  slug: string;
  currentPage: number;
  totalCount: number;
  searchQuery?: string;
};

export function CatalogPagination({ slug, currentPage, totalCount, searchQuery }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / CATALOG_PAGE_SIZE));
  if (totalPages <= 1) return null;

  const q = searchQuery?.trim();
  const prev = currentPage > 1 ? currentPage - 1 : null;
  const next = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 border-t border-zinc-100 pt-6"
      aria-label="Страницы каталога"
    >
      {prev != null ? (
        <Link
          href={buildCatalogHref(slug, { page: prev, q })}
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-brand hover:text-brand"
        >
          Назад
        </Link>
      ) : (
        <span className="rounded-2xl border border-transparent px-4 py-2 text-sm text-zinc-400">Назад</span>
      )}
      <span className="px-2 text-sm text-zinc-600">
        Страница {currentPage} из {totalPages}
        <span className="sr-only">, всего товаров: {totalCount}</span>
      </span>
      {next != null ? (
        <Link
          href={buildCatalogHref(slug, { page: next, q })}
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-brand hover:text-brand"
        >
          Вперёд
        </Link>
      ) : (
        <span className="rounded-2xl border border-transparent px-4 py-2 text-sm text-zinc-400">Вперёд</span>
      )}
    </nav>
  );
}
