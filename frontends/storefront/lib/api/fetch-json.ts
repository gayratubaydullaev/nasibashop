import { cookies } from "next/headers";
import { getPublicApiUrl } from "@/lib/env";
import { COOKIE_ACCESS } from "@/lib/auth/constants";

type FetchInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

export async function fetchJson<T>(path: string, init?: FetchInit): Promise<T | null> {
  const base = getPublicApiUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const { next, ...rest } = init ?? {};
  const opts: FetchInit = { ...rest };
  if (rest.cache !== "no-store") {
    opts.next = next ?? { revalidate: 60 };
  }

  const jar = await cookies();
  const userAccess = jar.get(COOKIE_ACCESS)?.value?.trim();
  const gatewayJwt = process.env.API_GATEWAY_JWT?.trim();
  const headers = new Headers(opts.headers ?? undefined);
  if (!headers.has("Authorization")) {
    if (userAccess) headers.set("Authorization", `Bearer ${userAccess}`);
    else if (gatewayJwt) headers.set("Authorization", `Bearer ${gatewayJwt}`);
  }
  opts.headers = headers;

  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
