"use server";

import { revalidatePath } from "next/cache";
import { patchStock } from "@/lib/api/product-detail";

export type UpdateStockFormState = {
  ok?: boolean;
  message?: string;
};

export async function updateProductStockAction(
  _prev: UpdateStockFormState,
  formData: FormData,
): Promise<UpdateStockFormState> {
  const productId = String(formData.get("productId") ?? "").trim();
  const variantId = String(formData.get("variantId") ?? "").trim();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const qtyRaw = formData.get("quantity");
  const quantity = typeof qtyRaw === "string" ? Number(qtyRaw) : Number(qtyRaw);

  if (!productId || !variantId || !storeId) {
    return { ok: false, message: "Не заданы product / variant / store" };
  }
  if (!Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, message: "Количество должно быть числом ≥ 0" };
  }

  const res = await patchStock(productId, {
    variantId,
    storeId,
    quantity: Math.floor(quantity),
  });
  if (!res.ok) {
    return { ok: false, message: res.message };
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/store/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/store/products");

  return { ok: true, message: "Остаток обновлён" };
}
