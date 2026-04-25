import type { Category } from "@/types/product";

export function flattenCategories(tree: Category[]): Category[] {
  const out: Category[] = [];
  const walk = (nodes: Category[]) => {
    for (const n of nodes) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(tree);
  return out;
}

export function findCategoryBySlug(tree: Category[], slug: string): Category | undefined {
  return flattenCategories(tree).find((c) => c.slug === slug);
}
