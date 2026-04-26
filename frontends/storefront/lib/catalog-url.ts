/** Параметры каталога для ссылок пагинации и поиска. */
export function buildCatalogHref(slug: string, opts: { page?: number; q?: string }): string {
  const params = new URLSearchParams();
  const q = opts.q?.trim();
  if (q) params.set("q", q);
  if (opts.page != null && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return `/catalog/${slug}${qs ? `?${qs}` : ""}`;
}
