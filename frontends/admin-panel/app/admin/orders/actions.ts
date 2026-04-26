"use server";

import { revalidatePath } from "next/cache";
import { getPublicApiUrl } from "@/lib/env";
import { resolveGatewayBearer } from "@/lib/auth/bearer";
import { ORDER_FLOW_STATUSES, type OrderFlowStatus } from "@/types/order";

export type OrderStatusActionState = {
  error?: string;
  ok?: boolean;
};

function isOrderStatus(s: string): s is OrderFlowStatus {
  return (ORDER_FLOW_STATUSES as readonly string[]).includes(s);
}

export async function updateOrderStatus(
  _prev: OrderStatusActionState,
  formData: FormData,
): Promise<OrderStatusActionState> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!orderId || !status || !isOrderStatus(status)) {
    return { error: "Noto‘g‘ri ma’lumot" };
  }

  const token = await resolveGatewayBearer();
  if (!token) {
    return { error: "Нет токена: войдите в панель или задайте API_GATEWAY_JWT в .env.local" };
  }

  const base = getPublicApiUrl();
  const res = await fetch(`${base}/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status,
      reason: "",
      changedBy: "admin-panel",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { error: text || `HTTP ${res.status}` };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/store/orders");
  return { ok: true };
}
