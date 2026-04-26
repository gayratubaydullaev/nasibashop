type Props = {
  title?: string;
  description?: string;
  actionPath: string;
  /** Предыдущий выбор — подставляется в поле */
  defaultStoreId?: string;
};

/** GET-форма: ?storeId=... (пусто — все заказы) */
export function OrdersStorePicker({ title, description, actionPath, defaultStoreId }: Props) {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 sm:p-5">
      {title ? <h2 className="text-lg font-semibold text-zinc-900">{title}</h2> : null}
      {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
      <form method="get" action={actionPath} className="space-y-3">
        <label className="block text-xs font-medium text-zinc-500">
          ID магазина (storeId)
          <input
            name="storeId"
            type="text"
            defaultValue={defaultStoreId ?? ""}
            placeholder="UUID; пусто — полный список"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-brand/20 focus:ring-2"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          {defaultStoreId?.trim() ? "Обновить" : "Показать по магазину"}
        </button>
      </form>
    </div>
  );
}
