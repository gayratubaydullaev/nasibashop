"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { OrderResponse } from "@/types/order";
import { ORDER_FLOW_STATUSES } from "@/types/order";
import { formatPriceUZS } from "@/lib/format-uzs";
import { updateOrderStatus, type OrderStatusActionState } from "@/app/admin/orders/actions";

type Props = {
  orders: OrderResponse[];
  emptyHint?: string;
};

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
    >
      {pending ? "…" : "Сохранить"}
    </button>
  );
}

function OrderStatusCell({ order }: { order: OrderResponse }) {
  const initial: OrderStatusActionState = {};
  const [state, formAction] = useActionState(updateOrderStatus, initial);
  const current = order.status;
  const known = (ORDER_FLOW_STATUSES as readonly string[]).includes(current);

  return (
    <td className="min-w-[200px] px-4 py-3 align-top">
      <form action={formAction} className="flex flex-col gap-1">
        <input type="hidden" name="orderId" value={order.id} />
        <div className="flex flex-wrap items-center gap-2">
          <select
            name="status"
            defaultValue={current}
            className="max-w-[160px] rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-800 outline-none ring-brand/20 focus:ring-2"
          >
            {!known ? (
              <option value={current}>
                {current}
              </option>
            ) : null}
            {ORDER_FLOW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <SubmitButton />
        </div>
        {state?.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
        {state?.ok ? <span className="text-xs text-emerald-600">Обновлено</span> : null}
      </form>
    </td>
  );
}

export function OrdersTable({ orders, emptyHint }: Props) {
  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-600">
        {emptyHint ?? "Заказов нет или API не ответил."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
        <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">Заказ</th>
            <th className="px-4 py-3">Клиент</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3">Сумма</th>
            <th className="px-4 py-3">Дата</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-800">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-zinc-50/80">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{shortId(o.id)}</td>
              <td className="max-w-[140px] truncate px-4 py-3 text-zinc-600">{o.userId}</td>
              <OrderStatusCell order={o} />
              <td className="whitespace-nowrap px-4 py-3 text-brand">{formatPriceUZS(o.totalUnits)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
