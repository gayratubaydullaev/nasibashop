import { cookies } from "next/headers";
import { COOKIE_ACCESS } from "@/lib/auth/constants";
import { decodeAccessToken, tokenExpiresSoon, type SessionClaims } from "@/lib/auth/jwt";

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_ACCESS)?.value?.trim() || null;
}

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const t = await getAccessTokenFromCookies();
  if (!t) return null;
  const claims = decodeAccessToken(t);
  if (!claims || tokenExpiresSoon(claims)) return null;
  return claims;
}

/** userId для профиля/чекаута: из JWT или dev-переменная. */
export async function getEffectiveUserId(): Promise<string | null> {
  const claims = await getSessionClaims();
  if (claims?.sub) return claims.sub;
  const dev = process.env.NEXT_PUBLIC_DEV_USER_ID?.trim();
  return dev || null;
}
