import Link from "next/link";
import { listProducts } from "@/lib/api/products";
import { ProductsTable } from "@/components/admin/products-table";
import { ProductsListPagination, ADMIN_PRODUCTS_PAGE_SIZE } from "@/components/admin/products-list-pagination";

export const dynamic = "force-dynamic";

function parsePage(raw: string | undefined): number {
  const n = parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function StoreProductsPage({ searchParams }: Props) {
  const { page: pageRaw } = await searchParams;
  const page = parsePage(pageRaw);
  const offset = (page - 1) * ADMIN_PRODUCTS_PAGE_SIZE;

  const data = await listProducts({
    status: "ACTIVE",
    limit: String(ADMIN_PRODUCTS_PAGE_SIZE),
    offset: String(offset),
  });

  const total = data?.pagination?.totalCount ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = offset + (data?.products?.length ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
        <h1 className="text-2xl font-bold text-zinc-900">Мои товары</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Активные товары (позже — фильтр по <code className="rounded bg-zinc-100 px-1">storeId</code>). Всего:{" "}
          {data?.pagination?.totalCount ?? "—"}
          {total > 0 ? (
            <>
              {" "}
              · показано {from}–{to}
            </>
          ) : null}
        </p>
        </div>
        <Link
          href="/store/products/create"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Новый товар
        </Link>
      </div>
      <ProductsTable
        products={data?.products ?? []}
        emptyMessage="Товаров нет или API недоступен. Проверьте Kong и product-service."
        editBasePath="/store/products"
      />
      <ProductsListPagination basePath="/store/products" currentPage={page} totalCount={total} />
    </div>
  );
}
