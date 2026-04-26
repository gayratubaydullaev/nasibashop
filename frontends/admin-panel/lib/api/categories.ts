import { fetchJson } from "@/lib/api/fetch-json";
import type { Category } from "@nasibashop/shared-types";

export type CategoriesResponse = {
  categories: Category[];
};

export async function getCategories(): Promise<CategoriesResponse | null> {
  return fetchJson<CategoriesResponse>("/api/categories", { next: { revalidate: 120 } });
}
