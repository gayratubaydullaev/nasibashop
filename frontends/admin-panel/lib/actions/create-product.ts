"use server";

import { revalidatePath } from "next/cache";
import { postProduct } from "@/lib/api/product-detail";
import type { Product, ProductImage, ProductVariant } from "@nasibashop/shared-types";

export type CreateProductFormState = {
  ok?: boolean;
  message?: string;
  productId?: string;
};

const STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
const MAX_VARIANTS_ON_CREATE = 20;

function padToLength(arr: string[], n: number): string[] {
  const out = arr.slice(0, n);
  while (out.length < n) out.push("");
  return out;
}

function parseVariantRowsFromForm(
  formData: FormData,
): { ok: true; variants: ProductVariant[] } | { ok: false; message: string } {
  const skus = formData.getAll("variantSku").map((v) => String(v ?? "").trim());
  const colors = formData.getAll("variantColor").map((v) => String(v ?? "").trim());
  const sizes = formData.getAll("variantSize").map((v) => String(v ?? "").trim());

  const n = Math.max(skus.length, colors.length, sizes.length);
  const ps = padToLength(skus, n);
  const pc = padToLength(colors, n);
  const pz = padToLength(sizes, n);

  const variants: ProductVariant[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) {
    const sku = ps[i]!;
    const colorRaw = pc[i]!;
    const sizeRaw = pz[i]!;
    if (!sku) {
      if (colorRaw || sizeRaw) {
        return {
          ok: false,
          message: `Вариант ${i + 1}: есть цвет или размер без SKU — укажите SKU или очистите строку`,
        };
      }
      continue;
    }
    if (seen.has(sku)) {
      return { ok: false, message: `SKU «${sku}» указан дважды — у каждого варианта должен быть уникальный SKU` };
    }
    seen.add(sku);
    variants.push({
      id: "",
      productId: "",
      sku,
      color: colorRaw || "—",
      size: sizeRaw || "—",
      active: true,
    });
  }

  if (variants.length === 0) {
    return { ok: false, message: "Добавьте хотя бы один вариант с SKU" };
  }
  if (variants.length > MAX_VARIANTS_ON_CREATE) {
    return { ok: false, message: `Не более ${MAX_VARIANTS_ON_CREATE} вариантов за один раз` };
  }
  return { ok: true, variants };
}

function buildProductFromForm(formData: FormData): { ok: true; product: Product } | { ok: false; message: string } {
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
  if (!categoryId) return { ok: false, message: "Укажите категорию" };

  const parsedVariants = parseVariantRowsFromForm(formData);
  if (!parsedVariants.ok) {
    return { ok: false, message: parsedVariants.message };
  }

  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim();
  const images: ProductImage[] = [];
  if (imageUrl) {
    images.push({
      id: "",
      productId: "",
      url: imageUrl,
      altText: imageAlt || titleUz,
      sortOrder: 0,
    });
  }

  const product: Product = {
    id: "",
    storeId,
    categoryId,
    titleUz,
    descriptionUz,
    brand,
    priceUnits: Math.round(priceUnits),
    currencyCode,
    discountPercent,
    status: status as Product["status"],
    variants: parsedVariants.variants,
    images,
  };

  return { ok: true, product };
}

export async function createProductAction(
  _prev: CreateProductFormState,
  formData: FormData,
): Promise<CreateProductFormState> {
  const built = buildProductFromForm(formData);
  if (!built.ok) {
    return { ok: false, message: built.message };
  }

  const res = await postProduct(built.product);
  if (!res.ok) {
    return { ok: false, message: res.message };
  }

  const productId = res.product.id;
  if (!productId) {
    return { ok: false, message: "В ответе нет id товара" };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/create");
  revalidatePath("/store/products");
  revalidatePath("/store/products/create");

  return { ok: true, message: "Товар создан", productId };
}
