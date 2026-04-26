"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type AuthFormState } from "@/app/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
    >
      {pending ? "Вход…" : "Войти"}
    </button>
  );
}

const initial: AuthFormState = {};

type Props = { nextPath: string };

export function LoginForm({ nextPath }: Props) {
  const [state, formAction] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {state.message ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.message}</p>
      ) : null}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-brand/20 focus:ring-2"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-brand/20 focus:ring-2"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
