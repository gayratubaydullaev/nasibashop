import Link from "next/link";

export const ADMIN_PRODUCTS_PAGE_SIZE = 24;

type Base = "/store/products" | "/admin/products";

type Props = {
  basePath: Base;
  currentPage: number;
  totalCount: number;
};

function pageHref(base: Base, page: number) {
  const p = new URLSearchParams();
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return `${base}${qs ? `?${qs}` : ""}`;
}

export function ProductsListPagination({ basePath, currentPage, totalCount }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_PRODUCTS_PAGE_SIZE));
  if (totalPages <= 1) return null;

  const prev = currentPage > 1 ? currentPage - 1 : null;
  const next = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 border-t border-zinc-200 pt-4" aria-label="Страницы списка товаров">
      {prev != null ? (
        <Link
          href={pageHref(basePath, prev)}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:border-brand hover:text-brand"
        >
          Назад
        </Link>
      ) : (
        <span className="rounded-xl px-4 py-2 text-sm text-zinc-400">Назад</span>
      )}
      <span className="px-2 text-sm text-zinc-600">
        Стр. {currentPage} из {totalPages}
      </span>
      {next != null ? (
        <Link
          href={pageHref(basePath, next)}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:border-brand hover:text-brand"
        >
          Вперёд
        </Link>
      ) : (
        <span className="rounded-xl px-4 py-2 text-sm text-zinc-400">Вперёд</span>
      )}
    </nav>
  );
}
