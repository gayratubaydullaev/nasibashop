import Link from "next/link";

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Buyurtma</h1>
      <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-card sm:p-8">
        <p className="text-sm font-medium text-brand">Keyingi bosqich</p>
        <p className="mt-2 text-zinc-700">
          Bu yerda Yetkazib berish / O‘zi olib ketish va Payme / Click / Uzcard / naqd tanlovi bo‘ladi — hozircha
          UI skeleti.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-zinc-600">
          <li>Manzil va kontakt</li>
          <li>To‘lov usuli</li>
          <li>Buyurtmani tasdiqlash</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cart" className="rounded-2xl border border-zinc-200 px-5 py-2.5 text-sm font-medium">
            Savatchaga qaytish
          </Link>
          <Link href="/profile" className="rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white">
            Profil (keyinroq)
          </Link>
        </div>
      </div>
    </div>
  );
}
