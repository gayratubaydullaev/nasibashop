"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { ProductFull } from "@nasibashop/shared-types";
import { updateProductStockAction, type UpdateStockFormState } from "@/lib/actions/update-product-stock";

type StockRow = {
  variantId: string;
  storeId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
};

function buildRows(full: ProductFull): StockRow[] {
  const p = full.product;
  const variants = p.variants ?? [];
  const stocks = full.stocks ?? [];
  const byKey = new Map<string, StockRow>();

  for (const s of stocks) {
    const key = `${s.variantId}|${s.storeId}`;
    const v = variants.find((x) => x.id === s.variantId);
    byKey.set(key, {
      variantId: s.variantId,
      storeId: s.storeId,
      sku: v?.sku ?? s.variantId.slice(0, 8),
      quantity: s.quantity,
      reservedQuantity: s.reservedQuantity,
    });
  }

  for (const v of variants) {
    const key = `${v.id}|${p.storeId}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        variantId: v.id,
        storeId: p.storeId,
        sku: v.sku,
        quantity: 0,
        reservedQuantity: 0,
      });
    }
  }

  return [...byKey.values()].sort((a, b) => a.sku.localeCompare(b.sku) || a.storeId.localeCompare(b.storeId));
}

const stockInitial: UpdateStockFormState = {};

function StockSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-900 disabled:opacity-50"
    >
      {pending ? "…" : "Сохранить"}
    </button>
  );
}

function StockRowForm({ productId, row }: { productId: string; row: StockRow }) {
  const router = useRouter();
  const [state, action] = useActionState(updateProductStockAction, stockInitial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={action} className="flex flex-col gap-2 border-b border-zinc-100 py-3 last:border-0 sm:flex-row sm:flex-wrap sm:items-end">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={row.variantId} />
      <input type="hidden" name="storeId" value={row.storeId} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900">{row.sku}</p>
        <p className="text-xs text-zinc-500">
          variant <span className="font-mono">{row.variantId.slice(0, 8)}…</span> · store{" "}
          <span className="font-mono">{row.storeId.slice(0, 8)}…</span>
        </p>
        <p className="text-xs text-zinc-600">
          Сейчас: <span className="font-semibold">{row.quantity}</span>, резерв{" "}
          <span className="font-semibold">{row.reservedQuantity}</span>
        </p>
      </div>
      <div className="flex items-end gap-2">
        <label className="text-xs text-zinc-600">
          Новое кол-во
          <input
            key={`${row.variantId}-${row.storeId}-${row.quantity}`}
            name="quantity"
            type="number"
            min={0}
            step={1}
            defaultValue={row.quantity}
            className="ml-2 w-24 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
          />
        </label>
        <StockSubmitButton />
      </div>
      {state.message ? (
        <p className={`w-full text-xs ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

type Props = {
  productFull: ProductFull;
};

export function ProductStockSection({ productFull }: Props) {
  const rows = buildRows(productFull);
  const productId = productFull.product.id;

  if (!productFull.product.variants?.length) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Остатки</h2>
        <p className="mt-2 text-sm text-zinc-600">Нет вариантов — сначала добавьте вариант через правку товара или API.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Остатки</h2>
      <p className="mt-1 text-sm text-zinc-600">
        <code className="rounded bg-zinc-100 px-1 text-xs">PATCH /api/products/{"{id}"}/stock</code> — устанавливает
        количество (с учётом резерва в БД).
      </p>
      <div className="mt-4">
        {rows.map((row) => (
          <StockRowForm key={`${row.variantId}-${row.storeId}`} productId={productId} row={row} />
        ))}
      </div>
    </div>
  );
}
