"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/types/product";
import { discountedPrice, formatPriceUZS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-url";

type Props = {
  product: Product;
  index?: number;
};

export function ProductCard({ product, index = 0 }: Props) {
  const img = product.images?.[0];
  const imageSrc = resolveMediaUrl(img?.url);
  const finalPrice = discountedPrice(product.priceUnits, product.discountPercent);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group"
    >
      <Link
        href={`/product/${product.id}`}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card",
          "transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-lg",
        )}
      >
        <div className="relative aspect-square bg-zinc-100">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={img?.altText || product.titleUz}
              fill
              className="object-cover transition group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">Нет фото</div>
          )}
          {product.discountPercent > 0 && (
            <span className="absolute left-2 top-2 rounded-lg bg-brand px-2 py-0.5 text-xs font-semibold text-white">
              -{product.discountPercent}%
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <h3 className="line-clamp-2 text-sm font-medium text-zinc-900 sm:text-base">{product.titleUz}</h3>
          <div className="mt-auto pt-2">
            {product.discountPercent > 0 && (
              <p className="text-xs text-zinc-400 line-through">{formatPriceUZS(product.priceUnits)}</p>
            )}
            <p className="text-base font-semibold text-brand">{formatPriceUZS(finalPrice)}</p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
