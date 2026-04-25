import type { PaymentRow } from "@/types/payment";

type Props = {
  payments: PaymentRow[];
};

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("uz-Latn-UZ", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatAmount(amountUnits: string, currency: string) {
  const n = Number(amountUnits);
  if (!Number.isFinite(n)) return amountUnits;
  const code = currency?.length === 3 ? currency : "UZS";
  try {
    return new Intl.NumberFormat("uz-Latn-UZ", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} ${code}`;
  }
}

export function PaymentsTable({ payments }: Props) {
  if (!payments.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-600">
        To‘lovlar yo‘q yoki API javob bermadi.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
        <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">To‘lov</th>
            <th className="px-4 py-3">Buyurtma</th>
            <th className="px-4 py-3">Holat</th>
            <th className="px-4 py-3">Provayder</th>
            <th className="px-4 py-3">Summa</th>
            <th className="px-4 py-3">Sana</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-800">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-zinc-50/80">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{shortId(p.id)}</td>
              <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs text-zinc-600">{p.orderId}</td>
              <td className="px-4 py-3">
                <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
                  {p.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">{p.provider}</td>
              <td className="whitespace-nowrap px-4 py-3 text-brand">{formatAmount(p.amountUnits, p.currencyCode)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600">{formatDate(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
