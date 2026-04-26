import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth/session";
import { StorefrontLoginForm } from "@/components/auth/storefront-login-form";

type Props = { searchParams: Promise<{ next?: string; expired?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSessionClaims();
  if (session) redirect("/");

  const q = await searchParams;
  const next = q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : "";

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Вход</h1>
        <p className="mt-1 text-sm text-zinc-600">Email и пароль. Нужен для профиля, чекаута и сохранённых адресов.</p>
        {q.expired ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Сессия истекла — войдите снова.
          </p>
        ) : null}
      </div>
      <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-card">
        <StorefrontLoginForm nextPath={next} />
        <p className="mt-6 text-center text-sm text-zinc-600">
          Нет аккаунта?{" "}
          <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-medium text-brand hover:underline">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
