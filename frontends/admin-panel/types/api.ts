import type { Product } from "@nasibashop/shared-types";

export type ProductListResponse = {
  products: Product[];
  pagination: { totalCount: number };
};
