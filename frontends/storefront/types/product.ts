import type { Category, Product, ProductFull } from "@nasibashop/shared-types";

export type { Category, Product, ProductFull };

export type ListProductsResponse = {
  products: Product[];
  pagination: { totalCount: number };
};

export type CategoriesResponse = {
  categories: Category[];
};
