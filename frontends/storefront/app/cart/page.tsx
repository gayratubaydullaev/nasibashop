"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useCartStore, MAX_CART_LINE_QTY } from "@/store/cart-store";
import { formatPriceUZS } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/resolve-url";

export default function CartPage() {
  const { lines, setQty, remove, clear } = useCartStore();

  const total = lines.reduce((s, l) => s + l.priceUnits * l.qty, 0);
  const needsRefresh = lines.some((l) => !l.storeId || !l.variantId || !l.sku);

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-card">
        <p className="font-medium text-zinc-800">Корзина пуста</p>
        <p className="mt-2 text-sm text-zinc-600">Добавьте товары из каталога.</p>
        <Link
          href="/catalog/barchasi"
          className="mt-6 inline-flex rounded-2xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-violet-700"
        >
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {needsRefresh ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Часть позиций добавлена до обновления каталога. Удалите такие товары и добавьте их снова со страницы
          товара — иначе оформление заказа будет недоступно.
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Корзина</h1>
        <button type="button" onClick={() => clear()} className="shrink-0 text-sm text-red-600 hover:underline">
          Очистить
        </button>
      </div>
      <ul className="space-y-3">
        {lines.map((line) => {
          const src = resolveMediaUrl(line.imageUrl);
          const lineTotal = line.priceUnits * line.qty;
          return (
            <li
              key={`${line.productId}-${line.variantId ?? line.sku ?? "line"}`}
              className="flex gap-4 rounded-2xl border border-zinc-100 bg-white p-3 shadow-card sm:p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                {src ? (
                  <Image src={src} alt={line.titleUz} fill className="object-cover" sizes="96px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${line.productId}`} className="font-medium text-zinc-900 hover:text-brand">
                  {line.titleUz}
                </Link>
                <p className="mt-1 text-sm text-zinc-500">Цена: {formatPriceUZS(line.priceUnits)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-zinc-500">Количество</span>
                  <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-0.5">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-white disabled:opacity-40"
                      aria-label="Меньше"
                      disabled={line.qty <= 1}
                      onClick={() => setQty(line.productId, line.qty - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">{line.qty}</span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-white disabled:opacity-40"
                      aria-label="Больше"
                      disabled={line.qty >= MAX_CART_LINE_QTY}
                      onClick={() => setQty(line.productId, line.qty + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="sr-only">Ввести количество</span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_CART_LINE_QTY}
                      inputMode="numeric"
                      className="w-14 rounded-lg border border-zinc-200 px-2 py-1 text-center text-sm"
                      value={line.qty}
                      onChange={(e) => setQty(line.productId, Number(e.target.value) || 1)}
                    />
                  </label>
                  <button type="button" onClick={() => remove(line.productId)} className="text-xs text-red-600 hover:underline">
                    Удалить
                  </button>
                </div>
                <p className="mt-2 text-sm font-semibold text-brand">Сумма: {formatPriceUZS(lineTotal)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-zinc-900">Итого: {formatPriceUZS(total)}</p>
          <p className="mt-1 text-xs text-zinc-500">До оформления доставка и комиссии не учтены.</p>
          <p className="mt-2 text-xs text-zinc-600">
            Оформление заказа доступно после{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              входа
            </Link>
            ; нет аккаунта —{" "}
            <Link href="/register" className="font-medium text-brand hover:underline">
              регистрация
            </Link>
            .
          </p>
        </div>
        <Link
          href="/checkout"
          className="inline-flex justify-center rounded-2xl bg-brand px-6 py-3 text-center text-sm font-semibold text-white"
        >
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}
