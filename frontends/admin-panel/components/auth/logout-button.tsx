"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Выход…" : "Выйти"}
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Submit />
    </form>
  );
}
