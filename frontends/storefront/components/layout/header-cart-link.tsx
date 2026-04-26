"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export function HeaderCartLink() {
  const totalQty = useCartStore((s) => s.lines.reduce((n, l) => n + l.qty, 0));

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-700 transition hover:bg-zinc-100"
      aria-label={totalQty > 0 ? `Корзина, ${totalQty} шт.` : "Корзина"}
    >
      <ShoppingBag className="h-5 w-5" />
      {totalQty > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
          {totalQty > 99 ? "99+" : totalQty}
        </span>
      ) : null}
    </Link>
  );
}
