"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addUserAddressAction, type AddUserAddressState } from "@/lib/actions/user-address";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
    >
      {pending ? "Сохранение…" : "Добавить адрес"}
    </button>
  );
}

const initial: AddUserAddressState = {};

type Props = { userId: string };

export function AddAddressForm({ userId }: Props) {
  const [state, formAction] = useActionState(addUserAddressAction, initial);

  return (
    <form action={formAction} className="mt-4 space-y-3 text-sm">
      <input type="hidden" name="userId" value={userId} />
      {state.message ? (
        <p
          className={`rounded-lg px-3 py-2 text-xs ${
            state.ok ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Подпись</label>
          <input name="label" placeholder="Дом, работа…" className="w-full rounded-lg border border-zinc-200 px-3 py-2" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-zinc-600">Область / регион</label>
          <input name="region" className="w-full rounded-lg border border-zinc-200 px-3 py-2" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Район</label>
          <input name="district" className="w-full rounded-lg border border-zinc-200 px-3 py-2" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Улица *</label>
          <input name="street" required className="w-full rounded-lg border border-zinc-200 px-3 py-2" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Дом *</label>
          <input name="house" required className="w-full rounded-lg border border-zinc-200 px-3 py-2" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Квартира</label>
          <input name="apartment" className="w-full rounded-lg border border-zinc-200 px-3 py-2" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-zinc-600">Ориентир</label>
          <input name="landmark" className="w-full rounded-lg border border-zinc-200 px-3 py-2" />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
