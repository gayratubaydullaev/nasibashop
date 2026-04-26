import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/api/product-detail";
import { getCategories } from "@/lib/api/categories";
import { ProductEditForm } from "@/components/admin/product-edit-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;
  const [detail, categoriesRes] = await Promise.all([getProductDetail(id), getCategories()]);
  if (!detail) notFound();

  const categories = categoriesRes?.categories ?? [];

  return (
    <div className="space-y-6">
      <nav className="text-xs text-zinc-500">
        <Link href="/admin/products" className="hover:text-brand">
          Товары
        </Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-800 truncate">Редактирование</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Товар</h1>
        <p className="mt-1 font-mono text-sm text-zinc-600">{detail.product.id}</p>
      </div>
      <ProductEditForm productFull={detail} categories={categories} backHref="/admin/products" />
    </div>
  );
}
