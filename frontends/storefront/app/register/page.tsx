import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth/session";
import { StorefrontRegisterForm } from "@/components/auth/storefront-register-form";

type Props = { searchParams: Promise<{ next?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const session = await getSessionClaims();
  if (session) redirect("/");

  const q = await searchParams;
  const next = q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : "";

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Регистрация</h1>
        <p className="mt-1 text-sm text-zinc-600">Создайте аккаунт покупателя (роль CUSTOMER).</p>
      </div>
      <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-card">
        <StorefrontRegisterForm nextPath={next} />
        <p className="mt-6 text-center text-sm text-zinc-600">
          Уже есть аккаунт?{" "}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-brand hover:underline">
            Вход
          </Link>
        </p>
      </div>
    </div>
  );
}
