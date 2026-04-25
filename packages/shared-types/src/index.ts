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
