"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category } from "@nasibashop/shared-types";
import { createProductAction, type CreateProductFormState } from "@/lib/actions/create-product";
import { flattenCategories } from "@/lib/categories";

type Props = {
  categories: Category[];
  defaultStoreId?: string;
  backHref: string;
  /** Куда перейти после успеха, например `/admin/products` */
  successPathPrefix: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
    >
      {pending ? "Создание…" : "Создать товар"}
    </button>
  );
}

const initial: CreateProductFormState = {};

const MAX_VARIANT_ROWS = 20;

export function ProductCreateForm({ categories, defaultStoreId = "", backHref, successPathPrefix }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(createProductAction, initial);
  const [variantRowKeys, setVariantRowKeys] = useState(() => [crypto.randomUUID()]);
  const flat = flattenCategories(categories);
  const categoryOptions = flat.length > 0 ? flat : [];

  const addVariantRow = () => {
    setVariantRowKeys((rows) => (rows.length >= MAX_VARIANT_ROWS ? rows : [...rows, crypto.randomUUID()]));
  };
  const removeVariantRow = (key: string) => {
    setVariantRowKeys((rows) => (rows.length <= 1 ? rows : rows.filter((k) => k !== key)));
  };

  useEffect(() => {
    if (state.ok && state.productId) {
      router.push(`${successPathPrefix}/${state.productId}`);
    }
  }, [state.ok, state.productId, successPathPrefix, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state.message && !state.ok ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.message}</p>
      ) : null}
      {state.ok && state.message && !state.productId ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{state.message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-zinc-600" htmlFor="titleUz">
            Название *
          </label>
          <input
            id="titleUz"
            name="titleUz"
            required
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
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-brand/20 focus:ring-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="brand">
            Бренд
          </label>
          <input id="brand" name="brand" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="status">
            Статус
          </label>
          <select
            id="status"
            name="status"
            defaultValue="DRAFT"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="storeId">
            Store ID *
          </label>
          <input
            id="storeId"
            name="storeId"
            required
            defaultValue={defaultStoreId}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-sm"
            placeholder="uuid магазина"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="categoryId">
            Категория *
          </label>
          {categoryOptions.length ? (
            <select
              id="categoryId"
              name="categoryId"
              required
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="">— выберите —</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameUz} ({c.slug})
                </option>
              ))}
            </select>
          ) : (
            <input
              id="categoryId"
              name="categoryId"
              required
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-sm"
              placeholder="UUID категории"
            />
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="priceUnits">
            Цена (units) *
          </label>
          <input
            id="priceUnits"
            name="priceUnits"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={0}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
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
            defaultValue={0}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600" htmlFor="currencyCode">
            Валюта
          </label>
          <input
            id="currencyCode"
            name="currencyCode"
            defaultValue="UZS"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">Варианты (SKU)</p>
            <p className="mt-1 text-sm text-zinc-600">
              Можно добавить несколько строк. Цена и скидка выше — общие для товара; уникальность SKU проверяется на
              сервере.
            </p>
          </div>
          <button
            type="button"
            onClick={addVariantRow}
            disabled={variantRowKeys.length >= MAX_VARIANT_ROWS}
            className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Вариант
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {variantRowKeys.map((rowKey, index) => (
            <div
              key={rowKey}
              className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-500">Вариант {index + 1}</span>
                {variantRowKeys.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeVariantRow(rowKey)}
                    className="text-xs font-medium text-red-700 hover:underline"
                  >
                    Удалить строку
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-medium text-zinc-600" htmlFor={`variantSku-${rowKey}`}>
                    SKU *
                  </label>
                  <input
                    id={`variantSku-${rowKey}`}
                    name="variantSku"
                    required={variantRowKeys.length === 1}
                    autoComplete="off"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-sm"
                    placeholder="например, TSH-001-S"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-600" htmlFor={`variantColor-${rowKey}`}>
                    Цвет
                  </label>
                  <input
                    id={`variantColor-${rowKey}`}
                    name="variantColor"
                    autoComplete="off"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-600" htmlFor={`variantSize-${rowKey}`}>
                    Размер
                  </label>
                  <input
                    id={`variantSize-${rowKey}`}
                    name="variantSize"
                    autoComplete="off"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-semibold uppercase text-zinc-500">Главное изображение (необязательно)</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="imageUrl">
              URL
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="imageAlt">
              Alt-текст
            </label>
            <input id="imageAlt" name="imageAlt" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <Link href={backHref} className="inline-flex items-center rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          Отмена
        </Link>
      </div>
    </form>
  );
}
