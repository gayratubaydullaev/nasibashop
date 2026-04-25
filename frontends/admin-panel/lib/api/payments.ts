import { fetchJson } from "@/lib/api/fetch-json";
import type { PagePaymentResponse } from "@/types/payment";

export async function listPayments(
  params?: { page?: string; size?: string; status?: string },
): Promise<PagePaymentResponse | null> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", params.page);
  q.set("size", params?.size ?? "50");
  if (params?.status) q.set("status", params.status);
  return fetchJson<PagePaymentResponse>(`/api/payments?${q.toString()}`, { cache: "no-store" });
}
