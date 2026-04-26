"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import type { ProductFull } from "@/types/product";
import { discountedPrice } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/resolve-url";
import { pickVariantForCart } from "@/lib/cart/pick-variant";

type Props = {
  productFull: ProductFull;
};

export function AddToCartButton({ productFull }: Props) {
  const add = useCartStore((s) => s.add);
  const [hint, setHint] = useState<string | null>(null);
  const product = productFull.product;
  const imageUrl = resolveMediaUrl(product.images?.[0]?.url) ?? undefined;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          setHint(null);
          try {
            const { variantId, sku, storeId } = pickVariantForCart(productFull);
            add({
              productId: product.id,
              storeId,
              variantId,
              sku,
              titleUz: product.titleUz,
              priceUnits: discountedPrice(product.priceUnits, product.discountPercent),
              discountPercent: 0,
              imageUrl,
              qty: 1,
            });
            setHint("Добавлено в корзину");
            setTimeout(() => setHint(null), 2000);
          } catch {
            setHint("Нет варианта товара для заказа — проверьте данные в product-service.");
          }
        }}
        className="w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-700 active:scale-[0.99] sm:w-auto sm:min-w-[200px]"
      >
        В корзину
      </button>
      {hint ? <p className="text-sm text-emerald-700">{hint}</p> : null}
    </div>
  );
}
