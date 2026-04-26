import Link from "next/link";
import { getCategories } from "@/lib/api/categories";
import { ProductCreateForm } from "@/components/admin/product-create-form";

export const dynamic = "force-dynamic";

export default async function AdminProductCreatePage() {
  const categoriesRes = await getCategories();
  const categories = categoriesRes?.categories ?? [];

  return (
    <div className="space-y-6">
      <nav className="text-xs text-zinc-500">
        <Link href="/admin/products" className="hover:text-brand">
          Товары
        </Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-800">Новый товар</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Новый товар</h1>
        <p className="mt-1 text-sm text-zinc-600">
          <code className="rounded bg-zinc-100 px-1">POST /api/products</code> — сервер задаёт id товара и варианта.
        </p>
      </div>
      <ProductCreateForm
        categories={categories}
        backHref="/admin/products"
        successPathPrefix="/admin/products"
      />
    </div>
  );
}
