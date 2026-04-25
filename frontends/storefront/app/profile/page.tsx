import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Shaxsiy kabinet</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/profile/orders/demo"
          className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card transition hover:border-brand/30"
        >
          <p className="font-semibold text-zinc-900">Mening buyurtmalarim</p>
          <p className="mt-1 text-sm text-zinc-600">Holat va tarix (demo havola)</p>
        </Link>
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-5">
          <p className="font-semibold text-zinc-700">Manzillar</p>
          <p className="mt-1 text-sm text-zinc-500">Keyinroq: user-service API</p>
        </div>
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-5">
          <p className="font-semibold text-zinc-700">Sevimlilar</p>
          <p className="mt-1 text-sm text-zinc-500">Keyinroq</p>
        </div>
      </div>
    </div>
  );
}
