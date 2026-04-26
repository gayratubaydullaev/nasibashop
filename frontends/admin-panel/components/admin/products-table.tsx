import Link from "next/link";
import type { Product } from "@nasibashop/shared-types";
import { formatPriceUZS } from "@/lib/format-uzs";

type Props = {
  products: Product[];
  emptyMessage?: string;
  /** Префикс ссылки «Редактировать», например `/admin/products` или `/store/products` */
  editBasePath?: string;
};

export function ProductsTable({ products, emptyMessage, editBasePath }: Props) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-600">
        {emptyMessage ?? "Товаров нет или API (`NEXT_PUBLIC_API_URL`) не ответил."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
        <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">Название</th>
            <th className="px-4 py-3">Бренд</th>
            <th className="px-4 py-3">Цена</th>
            <th className="px-4 py-3">Статус</th>
            {editBasePath ? <th className="px-4 py-3 w-28"> </th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-800">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-zinc-50/80">
              <td className="max-w-xs truncate px-4 py-3 font-medium">{p.titleUz}</td>
              <td className="px-4 py-3 text-zinc-600">{p.brand || "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-brand">{formatPriceUZS(p.priceUnits)}</td>
              <td className="px-4 py-3">
                <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                  {p.status}
                </span>
              </td>
              {editBasePath ? (
                <td className="px-4 py-3">
                  <Link
                    href={`${editBasePath}/${p.id}`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Изменить
                  </Link>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
