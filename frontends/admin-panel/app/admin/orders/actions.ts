"use server";

import { revalidatePath } from "next/cache";
import { getPublicApiUrl } from "@/lib/env";
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

  const token = process.env.API_GATEWAY_JWT?.trim();
  if (!token) {
    return { error: "API_GATEWAY_JWT sozlanmagan (.env.local)" };
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
