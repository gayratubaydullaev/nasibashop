import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/jwt";

export default async function HomePage() {
  const claims = await getSessionClaims();
  if (claims && hasRole(claims, "SUPER_ADMIN")) {
    redirect("/admin");
  }
  if (claims && hasRole(claims, "STORE_MANAGER")) {
    redirect("/store");
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-zinc-100 px-4 pb-10 pt-8 [padding-bottom:max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-lg space-y-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">NasibaShop</h1>
        <div className="flex justify-center">
          <Link
            href="/login"
            className="inline-flex min-h-12 min-w-[12rem] items-center justify-center rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg active:scale-[0.99]"
          >
            Войти
          </Link>
        </div>
        <p className="text-xs text-zinc-500">
          API: <code className="rounded bg-zinc-200 px-1">NEXT_PUBLIC_API_URL</code> (Kong). После входа JWT в httpOnly-cookie.
        </p>
      </div>
    </div>
  );
}
