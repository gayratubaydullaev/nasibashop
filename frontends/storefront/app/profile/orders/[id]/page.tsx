import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/api/orders";
import { formatPriceUZS } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const created = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(order.createdAt),
  );

  return (
    <div className="space-y-6">
      <nav className="text-xs text-zinc-500">
        <Link href="/profile" className="hover:text-brand">
          Профиль
        </Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-800">Заказ</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Заказ</h1>
          <p className="mt-1 font-mono text-sm text-zinc-600">{order.id}</p>
          <p className="mt-1 text-sm text-zinc-500">{created}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-700">
          {order.status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
          <p className="text-xs font-medium uppercase text-zinc-500">Оплата и доставка</p>
          <p className="mt-2 text-sm text-zinc-700">
            Способ: <span className="font-medium">{order.fulfillmentType}</span>
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            Оплата: <span className="font-medium">{order.paymentMethod}</span>
          </p>
          {order.deliveryAddress ? (
            <div className="mt-3 text-sm text-zinc-600">
              <p>
                {[order.deliveryAddress.region, order.deliveryAddress.district].filter(Boolean).join(", ")}
              </p>
              <p>
                {[order.deliveryAddress.street, order.deliveryAddress.house].filter(Boolean).join(", ")}
                {order.deliveryAddress.apartment ? `, кв. ${order.deliveryAddress.apartment}` : ""}
              </p>
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
          <p className="text-xs font-medium uppercase text-zinc-500">Суммы</p>
          <p className="mt-2 text-sm text-zinc-600">
            Товары: <span className="font-medium text-zinc-900">{formatPriceUZS(order.subtotalUnits)}</span>
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Доставка: <span className="font-medium text-zinc-900">{formatPriceUZS(order.deliveryFeeUnits)}</span>
          </p>
          <p className="mt-3 text-lg font-semibold text-brand">Итого: {formatPriceUZS(order.totalUnits)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Состав</h2>
        {!order.items?.length ? (
          <p className="mt-3 text-sm text-zinc-600">Позиции не пришли в ответе.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {order.items.map((it) => (
              <li key={it.id} className="flex flex-wrap justify-between gap-2 py-3 first:pt-0">
                <div>
                  <p className="font-medium text-zinc-900">{it.titleUz}</p>
                  <p className="text-xs text-zinc-500">
                    {it.quantity} × {formatPriceUZS(it.unitPriceUnits)} · SKU {it.sku}
                  </p>
                </div>
                <p className="font-semibold text-zinc-800">{formatPriceUZS(it.totalPriceUnits)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/profile" className="inline-block text-sm font-medium text-brand hover:underline">
        ← К профилю
      </Link>
    </div>
  );
}
