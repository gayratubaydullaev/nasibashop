"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/auth/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-brand hover:underline disabled:opacity-50"
    >
      {pending ? "Выход…" : "Выйти"}
    </button>
  );
}

export function StorefrontLogoutButton() {
  return (
    <form action={logoutAction} className="inline">
      <Submit />
    </form>
  );
}
