import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
      <div className="max-w-lg space-y-6 text-center">
        <h1 className="text-3xl font-bold text-zinc-900">NasibaShop</h1>
        <p className="text-zinc-600">Boshqaruv va do‘kon paneliga kiring.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/admin"
            className="rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg"
          >
            Super admin
          </Link>
          <Link
            href="/store"
            className="rounded-2xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-800"
          >
            Do‘kon menejeri
          </Link>
        </div>
        <p className="text-xs text-zinc-500">
          API: <code className="rounded bg-zinc-200 px-1">NEXT_PUBLIC_API_URL</code> (Kong 8000)
        </p>
      </div>
    </div>
  );
}
