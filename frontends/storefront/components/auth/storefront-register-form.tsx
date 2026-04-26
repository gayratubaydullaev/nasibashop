"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction, type AuthFormState } from "@/app/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
    >
      {pending ? "Регистрация…" : "Создать аккаунт"}
    </button>
  );
}

const initial: AuthFormState = {};

type Props = { nextPath: string };

export function StorefrontRegisterForm({ nextPath }: Props) {
  const [state, formAction] = useActionState(registerAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {state.message ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.message}</p>
      ) : null}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600" htmlFor="sf-name">
          Имя
        </label>
        <input
          id="sf-name"
          name="fullName"
          autoComplete="name"
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-brand/20 focus:ring-2"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600" htmlFor="sf-reg-email">
          Email
        </label>
        <input
          id="sf-reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-brand/20 focus:ring-2"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600" htmlFor="sf-reg-password">
          Пароль
        </label>
        <input
          id="sf-reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-brand/20 focus:ring-2"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
