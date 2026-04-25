import { getPublicApiUrl } from "@/lib/env";

export function resolveMediaUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${getPublicApiUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}
