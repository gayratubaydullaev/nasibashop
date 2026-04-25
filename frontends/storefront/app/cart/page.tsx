"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { formatPriceUZS } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/resolve-url";

export default function CartPage() {
  const { lines, setQty, remove, clear } = useCartStore();

  const total = lines.reduce((s, l) => s + l.priceUnits * l.qty, 0);

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-card">
        <p className="font-medium text-zinc-800">Savatcha bo‘sh</p>
        <p className="mt-2 text-sm text-zinc-600">Mahsulot qo‘shish uchun katalogga o‘ting.</p>
        <Link
          href="/catalog/barchasi"
          className="mt-6 inline-flex rounded-2xl bg-brand px-6 py-2.5 text-sm font-semibold text-white"
        >
          Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Savatcha</h1>
        <button type="button" onClick={() => clear()} className="text-sm text-red-600 hover:underline">
          Tozalash
        </button>
      </div>
      <ul className="space-y-3">
        {lines.map((line) => {
          const src = resolveMediaUrl(line.imageUrl);
          return (
            <li
              key={line.productId}
              className="flex gap-4 rounded-2xl border border-zinc-100 bg-white p-3 shadow-card sm:p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                {src ? (
                  <Image src={src} alt="" fill className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${line.productId}`} className="font-medium text-zinc-900 hover:text-brand">
                  {line.titleUz}
                </Link>
                <p className="mt-1 text-sm font-semibold text-brand">{formatPriceUZS(line.priceUnits)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <label className="text-xs text-zinc-500">
                    Soni
                    <input
                      type="number"
                      min={1}
                      className="ml-2 w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                      value={line.qty}
                      onChange={(e) => setQty(line.productId, Number(e.target.value) || 1)}
                    />
                  </label>
                  <button type="button" onClick={() => remove(line.productId)} className="text-xs text-red-600">
                    O‘chirish
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-semibold text-zinc-900">Jami: {formatPriceUZS(total)}</p>
        <Link
          href="/checkout"
          className="inline-flex justify-center rounded-2xl bg-brand px-6 py-3 text-center text-sm font-semibold text-white"
        >
          Buyurtmaga o‘tish
        </Link>
      </div>
    </div>
  );
}
