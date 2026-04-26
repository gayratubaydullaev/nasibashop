import { cookies } from "next/headers";
import { COOKIE_ACCESS } from "@/lib/auth/constants";
import { decodeAccessToken, tokenExpiresSoon, type SessionClaims } from "@/lib/auth/jwt";

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const c = await cookies();
  const v = c.get(COOKIE_ACCESS)?.value?.trim();
  return v || null;
}

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const t = await getAccessTokenFromCookies();
  if (!t) return null;
  const claims = decodeAccessToken(t);
  if (!claims || tokenExpiresSoon(claims)) return null;
  return claims;
}
