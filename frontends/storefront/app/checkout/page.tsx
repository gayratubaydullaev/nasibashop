import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getUserAddresses, getUserProfile } from "@/lib/api/users";
import { getEffectiveUserId, getSessionClaims } from "@/lib/auth/session";
import type { SavedAddress } from "@/types/user";

export default async function CheckoutPage() {
  const userId = (await getEffectiveUserId()) ?? "";
  const claims = await getSessionClaims();
  const userIdReadOnly = Boolean(claims?.sub);

  let profile = null;
  let savedAddresses: SavedAddress[] = [];
  if (userId) {
    const [p, a] = await Promise.all([getUserProfile(userId), getUserAddresses(userId)]);
    profile = p;
    savedAddresses = a;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <nav className="text-xs text-zinc-500">
          <Link href="/cart" className="hover:text-brand">
            Корзина
          </Link>
          <span className="mx-1">/</span>
          <span className="text-zinc-800">Оформление</span>
        </nav>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Оформление заказа</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Заказ уходит в order-service через Kong. Используется JWT из сессии после{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            входа
          </Link>
          ; для CI можно задать <code className="rounded bg-zinc-100 px-1">API_GATEWAY_JWT</code> на сервере.
        </p>
      </div>
      <CheckoutForm
        defaultUserId={userId}
        userIdReadOnly={userIdReadOnly}
        profile={profile}
        savedAddresses={savedAddresses}
      />
    </div>
  );
}
