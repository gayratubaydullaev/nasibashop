import { fetchJson } from "@/lib/api/fetch-json";
import { getPublicApiUrl } from "@/lib/env";
import { resolveGatewayBearer } from "@/lib/auth/bearer";
import type { Product, ProductFull, Stock } from "@nasibashop/shared-types";

export async function getProductDetail(id: string): Promise<ProductFull | null> {
  const data = await fetchJson<{ product: ProductFull }>(`/api/products/${id}`, { cache: "no-store" });
  return data?.product ?? null;
}

async function gatewayHeaders(): Promise<Headers> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const jwt = await resolveGatewayBearer();
  if (jwt) headers.set("Authorization", `Bearer ${jwt}`);
  return headers;
}

export async function postProduct(
  product: Product,
): Promise<{ ok: true; product: Product } | { ok: false; message: string }> {
  const base = getPublicApiUrl();
  try {
    const res = await fetch(`${base}/api/products`, {
      method: "POST",
      headers: await gatewayHeaders(),
      body: JSON.stringify(product),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, message: text || `HTTP ${res.status}` };
    }
    const data = JSON.parse(text) as { product: Product };
    return { ok: true, product: data.product };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сети";
    return { ok: false, message: msg };
  }
}

export type PatchStockBody = {
  variantId: string;
  storeId: string;
  quantity: number;
};

export async function patchStock(
  productId: string,
  body: PatchStockBody,
): Promise<{ ok: true; stock: Stock } | { ok: false; message: string }> {
  const base = getPublicApiUrl();
  try {
    const res = await fetch(`${base}/api/products/${productId}/stock`, {
      method: "PATCH",
      headers: await gatewayHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, message: text || `HTTP ${res.status}` };
    }
    const data = JSON.parse(text) as { stock: Stock };
    return { ok: true, stock: data.stock };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сети";
    return { ok: false, message: msg };
  }
}

export async function patchProduct(
  id: string,
  product: Product,
): Promise<{ ok: true; product: Product } | { ok: false; message: string }> {
  const base = getPublicApiUrl();

  try {
    const res = await fetch(`${base}/api/products/${id}`, {
      method: "PATCH",
      headers: await gatewayHeaders(),
      body: JSON.stringify(product),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, message: text || `HTTP ${res.status}` };
    }
    const data = JSON.parse(text) as { product: Product };
    return { ok: true, product: data.product };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сети";
    return { ok: false, message: msg };
  }
}
