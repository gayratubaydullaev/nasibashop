"use server";

import { revalidatePath } from "next/cache";
import { getPublicApiUrl } from "@/lib/env";
import { resolveGatewayBearer } from "@/lib/auth/bearer";

export type AddUserAddressState = { ok?: boolean; message?: string };

export async function addUserAddressAction(
  _prev: AddUserAddressState,
  formData: FormData,
): Promise<AddUserAddressState> {
  const userId = String(formData.get("userId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || "Дом";
  const region = String(formData.get("region") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();
  const house = String(formData.get("house") ?? "").trim();
  const apartment = String(formData.get("apartment") ?? "").trim();
  const landmark = String(formData.get("landmark") ?? "").trim();

  if (!userId) return { ok: false, message: "Не указан пользователь" };
  if (!street || !house) return { ok: false, message: "Улица и дом обязательны" };

  const jwt = await resolveGatewayBearer();
  if (!jwt) {
    return { ok: false, message: "Нет JWT: войдите или задайте API_GATEWAY_JWT" };
  }

  const body = {
    label,
    region: region || "—",
    district: district || "—",
    street,
    house,
    apartment: apartment || undefined,
    landmark: landmark || undefined,
    latitude: 0,
    longitude: 0,
    isDefault: false,
  };

  const base = getPublicApiUrl();
  try {
    const res = await fetch(`${base}/api/users/${userId}/addresses`, {
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сети";
    return { ok: false, message: msg };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Адрес сохранён" };
}
