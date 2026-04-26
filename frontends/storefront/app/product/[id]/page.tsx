import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api/products";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { formatPriceUZS, discountedPrice } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/resolve-url";

type Props = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const res = await getProduct(id);
  if (!res?.product) notFound();

  const { product, category } = res.product;
  const img = product.images?.[0];
  const src = resolveMediaUrl(img?.url);
  const price = discountedPrice(product.priceUnits, product.discountPercent);

  return (
    <div className="space-y-6">
      <nav
        className="flex min-h-[1.25rem] max-w-full flex-nowrap items-center gap-x-1 overflow-x-auto text-xs text-zinc-500 scrollbar-none sm:text-sm"
        aria-label="Хлебные крошки"
      >
        <Link href="/" className="shrink-0 hover:text-brand">
          Главная
        </Link>
        <span className="shrink-0">/</span>
        <Link href={`/catalog/${category.slug}`} className="shrink-0 hover:text-brand">
          {category.nameUz}
        </Link>
        <span className="shrink-0">/</span>
        <span className="min-w-0 truncate text-zinc-800">{product.titleUz}</span>
      </nav>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card sm:rounded-3xl">
          {src ? (
            <Image src={src} alt={img?.altText || product.titleUz} fill className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">Нет фото</div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{product.titleUz}</h1>
          {product.brand && <p className="text-sm text-zinc-500">Бренд: {product.brand}</p>}
          <div>
            {product.discountPercent > 0 && (
              <p className="text-sm text-zinc-400 line-through">{formatPriceUZS(product.priceUnits)}</p>
            )}
            <p className="text-2xl font-bold text-brand">{formatPriceUZS(price)}</p>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600">{product.descriptionUz}</p>
          <AddToCartButton productFull={res.product} />
        </div>
      </div>
    </div>
  );
}
