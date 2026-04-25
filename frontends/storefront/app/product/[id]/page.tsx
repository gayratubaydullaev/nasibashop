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
      <nav className="text-xs text-zinc-500">
        <Link href="/" className="hover:text-brand">
          Bosh sahifa
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/catalog/${category.slug}`} className="hover:text-brand">
          {category.nameUz}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-800 line-clamp-1">{product.titleUz}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-card">
          {src ? (
            <Image src={src} alt={img?.altText || product.titleUz} fill className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">Rasm yo‘q</div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{product.titleUz}</h1>
          {product.brand && <p className="text-sm text-zinc-500">Brend: {product.brand}</p>}
          <div>
            {product.discountPercent > 0 && (
              <p className="text-sm text-zinc-400 line-through">{formatPriceUZS(product.priceUnits)}</p>
            )}
            <p className="text-2xl font-bold text-brand">{formatPriceUZS(price)}</p>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600">{product.descriptionUz}</p>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
