"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category, ProductFull } from "@nasibashop/shared-types";
import { updateProductCoreAction, type UpdateProductFormState } from "@/lib/actions/update-product-core";
import { flattenCategories } from "@/lib/categories";
import { formatPriceUZS } from "@/lib/format-uzs";
import { ProductStockSection } from "@/components/admin/product-stock-section";

type Props = {
  productFull: ProductFull;
  categories: Category[];
  backHref: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
    >
      {pending ? "Сохранение…" : "Сохранить"}
    </button>
  );
}

const initial: UpdateProductFormState = {};

export function ProductEditForm({ productFull, categories, backHref }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateProductCoreAction, initial);
  const p = productFull.product;
  const flat = flattenCategories(categories);
  const categoryOptions =
    flat.length > 0 ? flat : productFull.category ? [productFull.category] : [];

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <>
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="productId" value={p.id} />

      {state.message ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            state.ok ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-zinc-600" htmlFor="titleUz">
            Название (titleUz)
          </label>
          <input
            id="titleUz"
            name="titleUz"
            required
            defaultValue={p.titleUz}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-brand/20 focus:ring-2"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-zinc-600" htmlFor="descriptionUz">
            Описание
          </label>
          <textarea
            id="descriptionUz"
            name="descriptionUz"
            rows={4}
            defaultValue={p.descriptionUz}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-brand/20 focus:ring-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="brand">
            Бренд
          </label>
          <input
            id="brand"
            name="brand"
            defaultValue={p.brand}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="status">
            Статус
          </label>
          <select
            id="status"
            name="status"
            defaultValue={p.status}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="storeId">
            Store ID
          </label>
          <input
            id="storeId"
            name="storeId"
            required
            defaultValue={p.storeId}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="categoryId">
            Категория
          </label>
          {categoryOptions.length ? (
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={p.categoryId}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
            >
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameUz} ({c.slug})
                </option>
              ))}
            </select>
          ) : (
            <>
              <input type="hidden" name="categoryId" value={p.categoryId} />
              <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">{p.categoryId}</p>
              <p className="text-xs text-zinc-500">Категории не загрузились — id отправляется как есть.</p>
            </>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="priceUnits">
            Цена (units)
          </label>
          <input
            id="priceUnits"
            name="priceUnits"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={p.priceUnits}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
          <p className="text-xs text-zinc-500">Сейчас: {formatPriceUZS(p.priceUnits)}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="discountPercent">
            Скидка, %
          </label>
          <input
            id="discountPercent"
            name="discountPercent"
            type="number"
            min={0}
            max={100}
            defaultValue={p.discountPercent}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="currencyCode">
            Валюта
          </label>
          <input
            id="currencyCode"
            name="currencyCode"
            defaultValue={p.currencyCode || "UZS"}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-semibold uppercase text-zinc-500">Варианты и остатки</p>
        <p className="mt-1 text-sm text-zinc-600">
          Варианты и изображения при «Сохранить» отправляются как в ответе API (ниже можно править только поля
          товара). Остатки по складам — отдельный блок под формой.
        </p>
        {p.variants?.length ? (
          <ul className="mt-3 space-y-1 text-xs text-zinc-700">
            {p.variants.map((v) => (
              <li key={v.id} className="font-mono">
                {v.sku} · {v.color} / {v.size} · active={String(v.active)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">Нет вариантов в ответе API.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <Link href={backHref} className="inline-flex items-center rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          Назад к списку
        </Link>
      </div>
    </form>
    <div className="mt-8">
      <ProductStockSection productFull={productFull} />
    </div>
    </>
  );
}
