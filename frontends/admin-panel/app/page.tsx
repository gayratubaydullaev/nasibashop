import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-zinc-100 px-4 pb-10 pt-8 [padding-bottom:max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-lg space-y-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">NasibaShop</h1>
        <p className="text-sm text-zinc-600 sm:text-base">Boshqaruv va do‘kon paneliga kiring.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/admin"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg active:scale-[0.99]"
          >
            Super admin
          </Link>
          <Link
            href="/store"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 active:scale-[0.99]"
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
