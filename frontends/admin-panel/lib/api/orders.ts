import { fetchJson } from "@/lib/api/fetch-json";
import type { PageOrderResponse } from "@/types/order";

export async function listAllOrders(
  params?: { page?: string; size?: string; status?: string },
): Promise<PageOrderResponse | null> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", params.page);
  q.set("size", params?.size ?? "50");
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return fetchJson<PageOrderResponse>(`/api/orders?${qs}`, { cache: "no-store" });
}

export async function listStoreOrders(
  storeId: string,
  params?: { page?: string; size?: string; status?: string },
): Promise<PageOrderResponse | null> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", params.page);
  if (params?.size) q.set("size", params.size ?? "50");
  else q.set("size", "50");
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  const path = `/api/orders/store/${encodeURIComponent(storeId)}${qs ? `?${qs}` : ""}`;
  return fetchJson<PageOrderResponse>(path, { cache: "no-store" });
}
