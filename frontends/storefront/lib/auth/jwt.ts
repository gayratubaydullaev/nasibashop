import { decodeJwt } from "jose";

export type JwtRole = "SUPER_ADMIN" | "STORE_MANAGER" | "CUSTOMER";

export type SessionClaims = {
  sub?: string;
  roles?: JwtRole[];
  exp?: number;
};

export function decodeAccessToken(token: string): SessionClaims | null {
  try {
    return decodeJwt(token) as SessionClaims;
  } catch {
    return null;
  }
}

export function tokenExpiresSoon(claims: SessionClaims, skewMs = 5000): boolean {
  if (claims.exp == null) return true;
  return claims.exp * 1000 < Date.now() + skewMs;
}
