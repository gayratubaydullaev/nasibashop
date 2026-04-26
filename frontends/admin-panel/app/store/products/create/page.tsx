import Link from "next/link";
import { getCategories } from "@/lib/api/categories";
import { ProductCreateForm } from "@/components/admin/product-create-form";

export const dynamic = "force-dynamic";

export default async function StoreProductCreatePage() {
  const categoriesRes = await getCategories();
  const categories = categoriesRes?.categories ?? [];
  const defaultStoreId = process.env.NEXT_PUBLIC_STORE_ID?.trim() ?? "";

  return (
    <div className="space-y-6">
      <nav className="text-xs text-zinc-500">
        <Link href="/store/products" className="hover:text-violet-700 hover:underline">
          Товары
        </Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-800">Новый товар</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Новый товар</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Store ID по умолчанию из <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_STORE_ID</code>, если задан.
        </p>
      </div>
      <ProductCreateForm
        categories={categories}
        defaultStoreId={defaultStoreId}
        backHref="/store/products"
        successPathPrefix="/store/products"
      />
    </div>
  );
}
