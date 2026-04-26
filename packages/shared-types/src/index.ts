/** Согласовано с product-service JSON (camelCase). */

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type ProductImage = {
  id: string;
  productId: string;
  mediaId?: string;
  url: string;
  altText: string;
  sortOrder: number;
};

/** Вариант товара (product-service, список и карточка). */
export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  color: string;
  size: string;
  priceOverrideUnits?: number;
  active: boolean;
};

export type Product = {
  id: string;
  storeId: string;
  categoryId: string;
  titleUz: string;
  descriptionUz: string;
  brand: string;
  priceUnits: number;
  currencyCode: string;
  discountPercent: number;
  status: ProductStatus;
  variants?: ProductVariant[];
  images?: ProductImage[];
};

export type Category = {
  id: string;
  parentId?: string;
  slug: string;
  nameUz: string;
  descriptionUz?: string;
  sortOrder: number;
  children?: Category[];
};

export type Stock = {
  id: string;
  productId: string;
  variantId: string;
  storeId: string;
  quantity: number;
  reservedQuantity: number;
};

export type ProductFull = {
  product: Product;
  category: Category;
  stocks: Stock[];
};
