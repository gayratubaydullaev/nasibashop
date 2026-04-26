import { listStoreOrders } from "@/lib/api/orders";
import { OrdersTable } from "@/components/admin/orders-table";
import { OrdersStorePicker } from "@/components/admin/orders-store-picker";
import { OrdersStatusFilters } from "@/components/admin/orders-status-filters";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ storeId?: string; status?: string }>;
};

export default async function StoreOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sid = process.env.NEXT_PUBLIC_STORE_ID?.trim() || sp.storeId?.trim();
  const statusFilter = sp.status?.trim();

  if (!sid) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Заказы</h1>
          <p className="mt-1 text-sm text-zinc-600">
            ID магазина: <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_STORE_ID</code> в .env или параметр{" "}
            <code className="rounded bg-zinc-100 px-1">?storeId=</code>.
          </p>
        </div>
        <OrdersStorePicker
          title="ID магазина"
          description="В продакшене значение обычно берётся из JWT или сессии."
          actionPath="/store/orders"
        />
      </div>
    );
  }

  const data = await listStoreOrders(sid, { size: "50", status: statusFilter });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Заказы</h1>
        <p className="mt-1 text-sm text-zinc-600">Всего: {data?.totalElements ?? "—"}</p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">По статусу</p>
        <OrdersStatusFilters basePath="/store/orders" storeId={sid} activeStatus={statusFilter} />
      </div>
      <OrdersTable orders={data?.content ?? []} />
    </div>
  );
}
