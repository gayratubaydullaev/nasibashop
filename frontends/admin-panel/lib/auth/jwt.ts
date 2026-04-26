import { decodeJwt } from "jose";

export type JwtRole = "SUPER_ADMIN" | "STORE_MANAGER" | "CUSTOMER";

export type SessionClaims = {
  sub?: string;
  roles?: JwtRole[];
  exp?: number;
};

export function decodeAccessToken(token: string): SessionClaims | null {
  try {
    const p = decodeJwt(token) as SessionClaims;
    return p;
  } catch {
    return null;
  }
}

export function tokenExpiresSoon(claims: SessionClaims, skewMs = 5000): boolean {
  if (claims.exp == null) return true;
  return claims.exp * 1000 < Date.now() + skewMs;
}

export function hasRole(claims: SessionClaims | null, role: JwtRole): boolean {
  return Boolean(claims?.roles?.includes(role));
}
