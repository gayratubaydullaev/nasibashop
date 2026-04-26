import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/auth/constants";

type JwtPayload = { sub?: string; exp?: number };

function readClaims(request: NextRequest): JwtPayload | null {
  const t = request.cookies.get(COOKIE_ACCESS)?.value;
  if (!t) return null;
  try {
    return decodeJwt(t) as JwtPayload;
  } catch {
    return null;
  }
}

function expired(p: JwtPayload): boolean {
  if (p.exp == null) return true;
  return p.exp * 1000 < Date.now() + 5000;
}

export function middleware(request: NextRequest) {
  const claims = readClaims(request);
  if (claims && expired(claims)) {
    const res = NextResponse.redirect(new URL("/login?expired=1", request.url));
    res.cookies.set(COOKIE_ACCESS, "", { path: "/", maxAge: 0 });
    res.cookies.set(COOKIE_REFRESH, "", { path: "/", maxAge: 0 });
    return res;
  }
  if (!claims?.sub) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`, request.url),
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/profile", "/profile/:path*", "/checkout", "/checkout/:path*"],
};
