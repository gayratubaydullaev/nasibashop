import { fetchJson } from "@/lib/api/fetch-json";
import type { OrderDetailResponse, PageOrderResponse } from "@/types/order";

export async function getMyOrders(userId: string, page = 0, size = 20): Promise<PageOrderResponse | null> {
  const q = new URLSearchParams({
    userId,
    page: String(page),
    size: String(size),
  });
  return fetchJson<PageOrderResponse>(`/api/orders/my?${q.toString()}`, { cache: "no-store" });
}

export async function getOrder(id: string): Promise<OrderDetailResponse | null> {
  return fetchJson<OrderDetailResponse>(`/api/orders/${id}`, { cache: "no-store" });
}
