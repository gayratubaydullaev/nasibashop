import Link from "next/link";
import { Suspense } from "react";
import { User } from "lucide-react";
import { getPublicApiUrl } from "@/lib/env";
import { getSessionClaims } from "@/lib/auth/session";
import { logoutAction } from "@/app/auth/actions";
import { HeaderSearch } from "@/components/layout/header-search";
import { HeaderCartLink } from "@/components/layout/header-cart-link";

export async function SiteHeader() {
  const api = getPublicApiUrl();
  const session = await getSessionClaims();

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

        <Suspense
          fallback={
            <>
              <div className="mx-auto hidden min-h-10 min-w-0 flex-1 rounded-2xl bg-zinc-100 sm:block" />
              <div className="min-h-10 flex-1 rounded-2xl bg-zinc-100 sm:hidden" />
            </>
          }
        >
          <HeaderSearch />
        </Suspense>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <HeaderCartLink />
          {session ? (
            <>
              <Link
                href="/profile"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-700 transition hover:bg-zinc-100"
                aria-label="Профиль"
              >
                <User className="h-5 w-5" />
              </Link>
              <form action={logoutAction} className="flex items-center">
                <button
                  type="submit"
                  className="rounded-xl px-2 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 sm:px-3 sm:text-sm"
                >
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/5"
            >
              Вход
            </Link>
          )}
        </div>
      </div>
      {process.env.NODE_ENV === "development" ? (
        <p className="sr-only">API: {api}</p>
      ) : null}
    </header>
  );
}
