"use server";

import { revalidatePath } from "next/cache";
import { getProductDetail, patchProduct } from "@/lib/api/product-detail";
import type { Product } from "@nasibashop/shared-types";

export type UpdateProductFormState = {
  ok?: boolean;
  message?: string;
};

const STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

function parseProductFromForm(
  formData: FormData,
  base: Product,
): { ok: true; product: Product } | { ok: false; message: string } {
  const titleUz = String(formData.get("titleUz") ?? "").trim();
  const descriptionUz = String(formData.get("descriptionUz") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const currencyCode = String(formData.get("currencyCode") ?? "UZS").trim() || "UZS";
  const statusRaw = String(formData.get("status") ?? "DRAFT").trim();
  const status = STATUSES.includes(statusRaw as (typeof STATUSES)[number]) ? statusRaw : "DRAFT";

  const priceUnits = Number(formData.get("priceUnits"));
  if (!Number.isFinite(priceUnits) || priceUnits < 0) {
    return { ok: false, message: "Некорректная цена" };
  }
  const discountPercent = Math.min(100, Math.max(0, Math.floor(Number(formData.get("discountPercent")) || 0)));

  if (!titleUz) return { ok: false, message: "Укажите название" };
  if (!storeId) return { ok: false, message: "Укажите storeId" };
  if (!categoryId) return { ok: false, message: "Укажите categoryId" };

  const merged: Product = {
    ...base,
    titleUz,
    descriptionUz,
    brand,
    storeId,
    categoryId,
    currencyCode,
    discountPercent,
    status: status as Product["status"],
    priceUnits: Math.round(priceUnits),
    variants: base.variants ?? [],
    images: base.images ?? [],
  };

  return { ok: true, product: merged };
}

export async function updateProductCoreAction(
  _prev: UpdateProductFormState,
  formData: FormData,
): Promise<UpdateProductFormState> {
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { ok: false, message: "Нет id товара" };
  }

  const detail = await getProductDetail(productId);
  if (!detail) {
    return { ok: false, message: "Товар не найден или API недоступен" };
  }

  const parsed = parseProductFromForm(formData, detail.product);
  if (!parsed.ok) {
    return { ok: false, message: parsed.message };
  }

  const saved = await patchProduct(productId, parsed.product);
  if (!saved.ok) {
    return { ok: false, message: saved.message };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/store/products");
  revalidatePath(`/store/products/${productId}`);

  return { ok: true, message: "Сохранено" };
}
