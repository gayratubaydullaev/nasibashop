import { fetchJson } from "@/lib/api/fetch-json";
import type { ProductListResponse } from "@/types/api";

export async function listProducts(params?: Record<string, string>): Promise<ProductListResponse | null> {
  const q = new URLSearchParams(params ?? {});
  if (!q.has("limit")) q.set("limit", "100");
  return fetchJson<ProductListResponse>(`/api/products?${q.toString()}`, { cache: "no-store" });
}
