"use client";

import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types/product";
import { discountedPrice } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/resolve-url";

type Props = {
  product: Product;
};

export function AddToCartButton({ product }: Props) {
  const add = useCartStore((s) => s.add);
  const imageUrl = resolveMediaUrl(product.images?.[0]?.url) ?? undefined;

  return (
    <button
      type="button"
      onClick={() =>
        add({
          productId: product.id,
          titleUz: product.titleUz,
          priceUnits: discountedPrice(product.priceUnits, product.discountPercent),
          discountPercent: 0,
          imageUrl,
          qty: 1,
        })
      }
      className="w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-700 active:scale-[0.99] sm:w-auto sm:min-w-[200px]"
    >
      Savatchaga
    </button>
  );
}
