import { listPayments } from "@/lib/api/payments";
import { PaymentsTable } from "@/components/admin/payments-table";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const { page, status } = await searchParams;
  const data = await listPayments({ page, size: "50", status });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">To‘lovlar</h1>
        <p className="mt-1 text-sm text-zinc-600">
          <code className="rounded bg-zinc-100 px-1 text-xs">GET /api/payments</code> · Jami:{" "}
          {data?.totalElements ?? "—"}
        </p>
      </div>
      <PaymentsTable payments={data?.content ?? []} />
    </div>
  );
}
