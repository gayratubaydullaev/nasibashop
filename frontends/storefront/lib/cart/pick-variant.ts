import type { ProductFull } from "@nasibashop/shared-types";

/** Выбор варианта и SKU для order-service (корзина / checkout). */
export function pickVariantForCart(full: ProductFull): { variantId: string; sku: string; storeId: string } {
  const storeId = full.product.storeId;
  const variants = full.product.variants ?? [];
  const stockVariantIds = new Set(full.stocks.map((s) => s.variantId));

  if (variants.length > 0) {
    const v =
      variants.find((x) => x.active && stockVariantIds.has(x.id)) ??
      variants.find((x) => stockVariantIds.has(x.id)) ??
      variants.find((x) => x.active) ??
      variants[0];
    const sku = v.sku?.trim() || `SKU-${v.id.replace(/-/g, "").slice(0, 12)}`;
    return { variantId: v.id, sku, storeId };
  }

  const firstStock = full.stocks[0];
  if (firstStock) {
    return {
      variantId: firstStock.variantId,
      sku: `SKU-${full.product.id.replace(/-/g, "").slice(0, 12)}`,
      storeId,
    };
  }

  throw new Error("NO_VARIANT");
}
