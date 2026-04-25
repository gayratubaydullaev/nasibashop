import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { getPublicApiUrl } from "@/lib/env";

export function SiteHeader() {
  const api = getPublicApiUrl();
  return (
    <header
      className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-3 md:gap-6 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-card">
            N
          </span>
          <span className="hidden font-semibold tracking-tight text-zinc-900 sm:inline">NasibaShop</span>
        </Link>

        <form
          action="/catalog/barchasi"
          method="get"
          className="relative mx-auto hidden min-w-0 flex-1 sm:block"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            type="search"
            placeholder="Mahsulot qidirish..."
            className="h-10 w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none ring-brand/30 transition placeholder:text-zinc-400 focus:border-brand focus:bg-white focus:ring-2"
          />
        </form>

        <form action="/catalog/barchasi" method="get" className="relative flex-1 sm:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            type="search"
            placeholder="Qidiruv..."
            className="h-10 w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-700 transition hover:bg-zinc-100"
            aria-label="Savatcha"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
          <Link
            href="/profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-700 transition hover:bg-zinc-100"
            aria-label="Profil"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
      <p className="sr-only">API: {api}</p>
    </header>
  );
}
