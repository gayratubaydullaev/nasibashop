"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { formatPriceUZS } from "@/lib/format";
import { createOrderAction } from "@/app/checkout/actions";
import type { SavedAddress, UserProfile } from "@/types/user";

const PAYMENT_OPTIONS = [
  { value: "CASH_ON_DELIVERY", label: "Наличными при получении" },
  { value: "PAYME", label: "Payme" },
  { value: "CLICK", label: "Click" },
  { value: "UZCARD", label: "Uzcard" },
] as const;

type PaymentValue = (typeof PAYMENT_OPTIONS)[number]["value"];

function dashToEmpty(s: string) {
  return s === "—" ? "" : s;
}

type Props = {
  defaultUserId: string;
  /** Если true — userId из сессии, поле только для чтения. */
  userIdReadOnly?: boolean;
  profile: UserProfile | null;
  savedAddresses: SavedAddress[];
};

export function CheckoutForm({ defaultUserId, userIdReadOnly = false, profile, savedAddresses }: Props) {
  const router = useRouter();
  const { lines, clear } = useCartStore();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState(defaultUserId);
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<PaymentValue>("CASH_ON_DELIVERY");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? "");
  const [landmarkNote, setLandmarkNote] = useState("");
  const [savedAddressId, setSavedAddressId] = useState("");

  const addressesForPicker = useMemo(() => {
    if (userIdReadOnly) return savedAddresses;
    if (userId.trim() !== defaultUserId.trim()) return [];
    return savedAddresses;
  }, [userId, defaultUserId, savedAddresses, userIdReadOnly]);

  const subtotal = lines.reduce((s, l) => s + l.priceUnits * l.qty, 0);
  const incomplete = lines.some((l) => !l.storeId || !l.variantId || !l.sku);
  const storeIds = [...new Set(lines.map((l) => l.storeId).filter(Boolean))];
  const multiStore = storeIds.length > 1;

  function applySavedAddress(id: string) {
    const a = savedAddresses.find((x) => x.id === id);
    if (!a) return;
    setRegion(dashToEmpty(a.region));
    setDistrict(dashToEmpty(a.district));
    setStreet(a.street);
    setHouse(a.house);
    setApartment(a.apartment ? dashToEmpty(a.apartment) : "");
    setLandmarkNote([a.label, a.landmark].filter(Boolean).join(" · "));
  }

  function submit() {
    setError(null);
    if (!lines.length) {
      setError("Корзина пуста.");
      return;
    }
    if (incomplete) {
      setError(
        "В корзине есть товары без данных для заказа. Удалите их и добавьте снова со страницы товара (кнопка «В корзину»).",
      );
      return;
    }
    if (multiStore) {
      setError("В одном заказе пока можно оформить товары только одного магазина. Разделите корзину.");
      return;
    }
    const storeId = storeIds[0];
    if (!storeId) {
      setError("Не удалось определить магазин (storeId).");
      return;
    }
    const uid = userId.trim();
    if (!uid) {
      setError(
        userIdReadOnly
          ? "Не найден пользователь сессии. Обновите страницу или войдите снова."
          : "Укажите ID пользователя или войдите через /login.",
      );
      return;
    }
    if (fulfillment === "DELIVERY") {
      if (!street.trim() || !house.trim()) {
        setError("Для доставки укажите улицу и дом.");
        return;
      }
    }

    const landmarkMerged =
      [contactPhone.trim() && `Тел: ${contactPhone.trim()}`, landmarkNote.trim()].filter(Boolean).join(" · ") ||
      null;

    startTransition(async () => {
      const result = await createOrderAction({
        userId: uid,
        storeId,
        fulfillmentType: fulfillment,
        paymentMethod,
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId!,
          sku: l.sku!,
          titleUz: l.titleUz,
          quantity: l.qty,
          unitPriceUnits: l.priceUnits,
        })),
        deliveryAddress:
          fulfillment === "DELIVERY"
            ? {
                region: region.trim() || null,
                district: district.trim() || null,
                street: street.trim(),
                house: house.trim(),
                apartment: apartment.trim() || null,
                landmark: landmarkMerged,
                latitude: null,
                longitude: null,
              }
            : null,
        pickupStoreId: fulfillment === "PICKUP" ? storeId : null,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }
      clear();
      router.push(`/profile/orders/${result.orderId}`);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6 rounded-3xl border border-zinc-100 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-semibold text-zinc-900">Данные заказа</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700" htmlFor="checkout-user">
            ID пользователя (userId)
          </label>
          <input
            id="checkout-user"
            readOnly={userIdReadOnly}
            className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm outline-none ring-brand/20 focus:ring-2 read-only:bg-zinc-50 read-only:text-zinc-700"
            value={userId}
            onChange={userIdReadOnly ? undefined : (e) => setUserId(e.target.value)}
            autoComplete="off"
          />
          <p className="text-xs text-zinc-500">
            {userIdReadOnly
              ? "Подставлено из вашей сессии (JWT)."
              : `Без входа можно указать вручную (или задайте NEXT_PUBLIC_DEV_USER_ID). Сохранённые адреса — только если совпадает с загруженным userId.${
                  userId.trim() !== defaultUserId.trim()
                    ? " Сейчас адрес из профиля недоступен: значение отличается от начального."
                    : ""
                }`}
          </p>
        </div>

        {profile ? (
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
            <p className="font-medium text-zinc-900">{profile.fullName}</p>
            {profile.phone ? (
              <p className="mt-1 text-zinc-600">
                Телефон в профиле: <span className="font-mono">{profile.phone}</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">В профиле нет телефона — укажите ниже для курьера.</p>
            )}
          </div>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-zinc-700">Способ получения</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="fulfillment"
              checked={fulfillment === "DELIVERY"}
              onChange={() => setFulfillment("DELIVERY")}
            />
            Доставка
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="fulfillment"
              checked={fulfillment === "PICKUP"}
              onChange={() => setFulfillment("PICKUP")}
            />
            Самовывоз (магазин = storeId из корзины)
          </label>
        </fieldset>

        {fulfillment === "DELIVERY" ? (
          <div className="space-y-4">
            {addressesForPicker.length > 0 ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600" htmlFor="checkout-saved-addr">
                  Сохранённый адрес (профиль)
                </label>
                <select
                  id="checkout-saved-addr"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  value={savedAddressId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSavedAddressId(id);
                    if (id) applySavedAddress(id);
                  }}
                >
                  <option value="">— Ввести вручную —</option>
                  {addressesForPicker.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}: {a.street}, {a.house}
                      {a.apartment ? `, кв. ${a.apartment}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">Область / регион</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Например, Ташкент"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Район</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Улица *</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Дом *</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  value={house}
                  onChange={(e) => setHouse(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Квартира</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">Телефон для связи (курьер)</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+998 …"
                  inputMode="tel"
                />
                <p className="text-xs text-zinc-500">Попадает в поле «ориентир» заказа вместе с комментарием ниже.</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">Комментарий / ориентир</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  value={landmarkNote}
                  onChange={(e) => setLandmarkNote(e.target.value)}
                  placeholder="Подъезд, домофон…"
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700" htmlFor="checkout-pay">
            Оплата
          </label>
          <select
            id="checkout-pay"
            className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/20"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentValue)}
          >
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending || !lines.length}
            onClick={() => submit()}
            className="rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-700 disabled:opacity-50"
          >
            {pending ? "Отправка…" : "Подтвердить заказ"}
          </button>
          <Link href="/cart" className="inline-flex items-center rounded-2xl border border-zinc-200 px-6 py-3 text-sm font-medium">
            В корзину
          </Link>
        </div>
      </div>

      <aside className="h-fit rounded-3xl border border-zinc-100 bg-zinc-50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Состав</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((l) => (
            <li
              key={`${l.productId}-${l.variantId ?? l.sku ?? "x"}`}
              className="flex justify-between gap-2 border-b border-zinc-200/80 pb-2 last:border-0"
            >
              <span className="min-w-0 truncate text-zinc-800">
                {l.titleUz} × {l.qty}
              </span>
              <span className="shrink-0 font-medium text-brand">{formatPriceUZS(l.priceUnits * l.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-base font-semibold text-zinc-900">Итого: {formatPriceUZS(subtotal)}</p>
        {incomplete ? (
          <p className="mt-2 text-xs text-amber-800">Есть позиции без variant/sku — пересоберите корзину с карточки товара.</p>
        ) : null}
      </aside>
    </div>
  );
}
