"use server";

import { getPublicApiUrl } from "@/lib/env";
import { resolveGatewayBearer } from "@/lib/auth/bearer";

export type CreateOrderItemInput = {
  productId: string;
  variantId: string;
  sku: string;
  titleUz: string;
  quantity: number;
  unitPriceUnits: number;
};

export type CreateOrderInput = {
  userId: string;
  storeId: string;
  fulfillmentType: "DELIVERY" | "PICKUP";
  paymentMethod: "PAYME" | "CLICK" | "UZCARD" | "CASH_ON_DELIVERY";
  items: CreateOrderItemInput[];
  deliveryAddress?: {
    region?: string | null;
    district?: string | null;
    street?: string | null;
    house?: string | null;
    apartment?: string | null;
    landmark?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  pickupStoreId?: string | null;
};

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; message: string };

export async function createOrderAction(input: CreateOrderInput): Promise<CreateOrderResult> {
  const base = getPublicApiUrl();
  const jwt = await resolveGatewayBearer();
  if (!jwt) {
    return {
      ok: false,
      message: "Нет JWT: войдите на сайт или задайте API_GATEWAY_JWT для оформления через Kong.",
    };
  }

  const body: Record<string, unknown> = {
    userId: input.userId,
    storeId: input.storeId,
    fulfillmentType: input.fulfillmentType,
    paymentMethod: input.paymentMethod,
    items: input.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      sku: i.sku,
      titleUz: i.titleUz,
      quantity: i.quantity,
      unitPriceUnits: i.unitPriceUnits,
    })),
  };

  if (input.fulfillmentType === "DELIVERY") {
    body.deliveryAddress = input.deliveryAddress ?? null;
    body.pickupStoreId = null;
  } else {
    body.deliveryAddress = null;
    body.pickupStoreId = input.pickupStoreId ?? input.storeId;
  }

  try {
    const res = await fetch(`${base}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      return { ok: false, message: text || `HTTP ${res.status}` };
    }

    let data: { id?: string };
    try {
      data = JSON.parse(text) as { id?: string };
    } catch {
      return { ok: false, message: "Некорректный ответ API" };
    }
    if (!data.id) {
      return { ok: false, message: "В ответе нет id заказа" };
    }
    return { ok: true, orderId: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сети";
    return { ok: false, message: msg };
  }
}
