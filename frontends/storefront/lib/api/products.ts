import type { CategoriesResponse, ListProductsResponse, ProductFull } from "@/types/product";
import { fetchJson } from "@/lib/api/fetch-json";

export async function getFeaturedProducts(): Promise<ListProductsResponse | null> {
  return fetchJson<ListProductsResponse>("/api/products?limit=8&status=ACTIVE", {
    next: { revalidate: 30 },
  });
}

export async function getCategories(): Promise<CategoriesResponse | null> {
  return fetchJson<CategoriesResponse>("/api/categories", { next: { revalidate: 120 } });
}

export async function getProduct(id: string): Promise<{ product: ProductFull } | null> {
  return fetchJson<{ product: ProductFull }>(`/api/products/${id}`, { cache: "no-store" });
}

export async function getProductsByCategoryId(
  categoryId: string,
  limit = 24,
  offset = 0,
): Promise<ListProductsResponse | null> {
  const q = new URLSearchParams({
    categoryId,
    limit: String(limit),
    status: "ACTIVE",
  });
  if (offset > 0) q.set("offset", String(offset));
  return fetchJson<ListProductsResponse>(`/api/products?${q.toString()}`, { next: { revalidate: 30 } });
}

export async function getCatalogProducts(opts: {
  searchQuery?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}): Promise<ListProductsResponse | null> {
  const limit = opts.limit ?? 24;
  const params = new URLSearchParams({ limit: String(limit), status: "ACTIVE" });
  if (opts.searchQuery) params.set("q", opts.searchQuery);
  if (opts.categoryId) params.set("categoryId", opts.categoryId);
  if (opts.offset != null && opts.offset > 0) params.set("offset", String(opts.offset));
  return fetchJson<ListProductsResponse>(`/api/products?${params.toString()}`, { next: { revalidate: 30 } });
}
