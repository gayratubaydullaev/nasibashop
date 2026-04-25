import { listProducts } from "@/lib/api/products";
import { ProductsTable } from "@/components/admin/products-table";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const data = await listProducts({ status: "ACTIVE", limit: "200" });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Barcha mahsulotlar</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Ma’lumot: <code className="rounded bg-zinc-100 px-1">GET /api/products</code> (Kong). Jami:{" "}
          {data?.pagination?.totalCount ?? "—"}
        </p>
      </div>
      <ProductsTable products={data?.products ?? []} />
    </div>
  );
}
