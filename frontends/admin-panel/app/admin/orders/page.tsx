import Link from "next/link";
import { listAllOrders, listStoreOrders } from "@/lib/api/orders";
import { OrdersTable } from "@/components/admin/orders-table";
import { OrdersStorePicker } from "@/components/admin/orders-store-picker";
import { OrdersStatusFilters } from "@/components/admin/orders-status-filters";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ storeId?: string; page?: string; status?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { storeId, page, status } = await searchParams;
  const sid = storeId?.trim();

  const statusFilter = status?.trim();

  const data = sid
    ? await listStoreOrders(sid, { page, size: "50", status: statusFilter })
    : await listAllOrders({ page, size: "50", status: statusFilter });

  const emptyHint = sid
    ? "Для этого магазина заказов нет или API не ответил."
    : "Заказов пока нет или API не ответил.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Заказы</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {sid ? (
              <>
                Магазин: <span className="font-mono text-zinc-800">{sid}</span> ·{" "}
                <code className="rounded bg-zinc-100 px-1 text-xs">GET /api/orders/store/{"{storeId}"}</code>
              </>
            ) : (
              <>
                Все магазины · <code className="rounded bg-zinc-100 px-1 text-xs">GET /api/orders</code>
              </>
            )}{" "}
            · Всего: {data?.totalElements ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sid ? (
            <Link
              href="/admin/orders"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Все заказы
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">По магазину</p>
        <p className="mt-1 text-sm text-zinc-600">
          Укажите <span className="font-mono">storeId</span>, чтобы видеть заказы одного магазина.
        </p>
        <div className="mt-3">
          <OrdersStorePicker actionPath="/admin/orders" defaultStoreId={sid} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">По статусу</p>
        <OrdersStatusFilters basePath="/admin/orders" storeId={sid} activeStatus={statusFilter} />
      </div>

      <OrdersTable orders={data?.content ?? []} emptyHint={emptyHint} />
    </div>
  );
}
