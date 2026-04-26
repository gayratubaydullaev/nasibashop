import Link from "next/link";
import { AddAddressForm } from "@/components/profile/add-address-form";
import { getUserAddresses, getUserProfile } from "@/lib/api/users";
import { getMyOrders } from "@/lib/api/orders";
import { getEffectiveUserId } from "@/lib/auth/session";
import { formatPriceUZS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const userId = await getEffectiveUserId();
  const ordersPage = userId ? await getMyOrders(userId, 0, 15) : null;
  const orders = ordersPage?.content ?? [];
  const profile = userId ? await getUserProfile(userId) : null;
  const addresses = userId ? await getUserAddresses(userId) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Личный кабинет</h1>

      {!userId ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Не удалось определить пользователя. Войдите через{" "}
          <Link href="/login" className="font-medium text-brand underline">
            /login
          </Link>
          .
        </p>
      ) : null}

      {userId && profile ? (
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Профиль</p>
          <p className="mt-2 font-semibold text-zinc-900">{profile.fullName}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
            {profile.phone ? (
              <span>
                Тел.: <span className="font-mono">{profile.phone}</span>
              </span>
            ) : (
              <span className="text-zinc-500">Телефон не указан</span>
            )}
            {profile.email ? (
              <span>
                Email: <span className="font-mono">{profile.email}</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card sm:col-span-2">
          <p className="font-semibold text-zinc-900">Мои заказы</p>
          {!userId ? (
            <p className="mt-2 text-sm text-zinc-500">Список недоступен.</p>
          ) : !ordersPage ? (
            <p className="mt-2 text-sm text-zinc-600">
              Не удалось загрузить заказы. Проверьте Kong и доступ JWT к <code className="rounded bg-zinc-100 px-1">/api/orders</code>.
            </p>
          ) : orders.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600">Пока нет заказов.</p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                  <div>
                    <Link href={`/profile/orders/${o.id}`} className="font-medium text-brand hover:underline">
                      Заказ {o.id.slice(0, 8)}…
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(
                        new Date(o.createdAt),
                      )}{" "}
                      · {o.status}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{formatPriceUZS(o.totalUnits)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
          <p className="font-semibold text-zinc-900">Адреса доставки</p>
          {!userId ? (
            <p className="mt-2 text-sm text-zinc-500">Войдите, чтобы сохранять адреса.</p>
          ) : (
            <>
              {addresses.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600">Пока нет сохранённых адресов.</p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm">
                  {addresses.map((a) => (
                    <li key={a.id} className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
                      <p className="font-medium text-zinc-900">{a.label}</p>
                      <p className="mt-1 text-zinc-600">
                        {[a.region, a.district].filter((x) => x && x !== "—").join(", ")}
                        {a.street ? `, ${a.street}` : ""}
                        {a.house ? `, д. ${a.house}` : ""}
                        {a.apartment ? `, кв. ${a.apartment}` : ""}
                      </p>
                      {a.isDefault ? (
                        <p className="mt-1 text-xs font-medium text-brand">По умолчанию</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-zinc-500">
                Сохранение через user-service (Bearer из сессии или <code className="rounded bg-zinc-100 px-1">API_GATEWAY_JWT</code>).
              </p>
              <AddAddressForm userId={userId} />
            </>
          )}
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-5">
          <p className="font-semibold text-zinc-700">Избранное</p>
          <p className="mt-1 text-sm text-zinc-500">Позже</p>
        </div>
      </div>
    </div>
  );
}
