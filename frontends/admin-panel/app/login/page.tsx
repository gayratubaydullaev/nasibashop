import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

type Props = { searchParams: Promise<{ next?: string; expired?: string; forbidden?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const next = q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : "";

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-card">
        <h1 className="text-xl font-bold text-zinc-900">Вход в панель</h1>
        <p className="mt-1 text-sm text-zinc-600">Администратор или менеджер магазина (email и пароль).</p>
        {q.expired ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Сессия истекла — войдите снова.
          </p>
        ) : null}
        {q.forbidden ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Недостаточно прав для этого раздела.
          </p>
        ) : null}
        <div className="mt-6">
          <LoginForm nextPath={next} />
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/" className="text-brand hover:underline">
            На стартовую страницу
          </Link>
        </p>
      </div>
    </div>
  );
}
