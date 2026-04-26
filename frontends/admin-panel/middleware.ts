import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/auth/constants";
import { pathBehindHttpBasicGate, rejectUnlessHttpBasicOk } from "@/lib/auth/http-basic-gate";

type JwtPayload = { sub?: string; roles?: string[]; exp?: number };

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
  const { pathname } = request.nextUrl;

  if (pathBehindHttpBasicGate(pathname)) {
    const basicBlock = rejectUnlessHttpBasicOk(request);
    if (basicBlock) return basicBlock;
  }

  const claims = readClaims(request);

  if (claims && expired(claims)) {
    const res = NextResponse.redirect(new URL("/login?expired=1", request.url));
    res.cookies.set(COOKIE_ACCESS, "", { path: "/", maxAge: 0 });
    res.cookies.set(COOKIE_REFRESH, "", { path: "/", maxAge: 0 });
    return res;
  }

  if (pathname.startsWith("/admin")) {
    if (!claims?.roles?.length) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
    }
    if (claims.roles.includes("STORE_MANAGER") && !claims.roles.includes("SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/store", request.url));
    }
    if (!claims.roles.includes("SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/login?forbidden=1", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/store")) {
    if (!claims?.roles?.length) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
    }
    const allowed = claims.roles.includes("STORE_MANAGER") || claims.roles.includes("SUPER_ADMIN");
    if (!allowed) {
      return NextResponse.redirect(new URL("/login?forbidden=1", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/store/:path*"],
};
