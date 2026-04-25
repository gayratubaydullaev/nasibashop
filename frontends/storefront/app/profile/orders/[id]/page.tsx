import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <nav className="text-xs text-zinc-500">
        <Link href="/profile" className="hover:text-brand">
          Profil
        </Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-800">Buyurtma #{id}</span>
      </nav>
      <h1 className="text-2xl font-bold text-zinc-900">Buyurtma #{id}</h1>
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-card">
        <p className="text-sm text-zinc-600">
          Bu sahifa `order-service` bilan bog‘langanda: mahsulotlar ro‘yxati, status, kuzatuv.
        </p>
      </div>
    </div>
  );
}
