import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REALM = "NasibaShop Admin";

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Base64url-safe payload (RFC 7617) to UTF-8 string for Edge. */
function base64PayloadToUtf8(b64: string): string {
  const normalized = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function readBasicCredentials(header: string | null): { user: string; password: string } | null {
  if (!header || !header.toLowerCase().startsWith("basic ")) return null;
  const b64 = header.slice(6).trim();
  if (!b64) return null;
  try {
    const decoded = base64PayloadToUtf8(b64);
    const colon = decoded.indexOf(":");
    if (colon === -1) return { user: decoded, password: "" };
    return { user: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
  } catch {
    return null;
  }
}

export function httpBasicGateEnabled(): boolean {
  const u = process.env.ADMIN_PANEL_HTTP_BASIC_USER?.trim() ?? "";
  const p = process.env.ADMIN_PANEL_HTTP_BASIC_PASSWORD ?? "";
  return u.length > 0 && p.length > 0;
}

export function pathBehindHttpBasicGate(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/store")) return true;
  return false;
}

/** 401 if gate включён и заголовок неверен; иначе null. */
export function rejectUnlessHttpBasicOk(request: NextRequest): NextResponse | null {
  if (!httpBasicGateEnabled()) return null;

  const expectedUser = process.env.ADMIN_PANEL_HTTP_BASIC_USER!.trim();
  const expectedPass = process.env.ADMIN_PANEL_HTTP_BASIC_PASSWORD!;

  const creds = readBasicCredentials(request.headers.get("authorization"));
  if (!creds) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": `Basic realm="${REALM}"`, "Cache-Control": "no-store" },
    });
  }

  const userOk = timingSafeEqualString(creds.user, expectedUser);
  const passOk = timingSafeEqualString(creds.password, expectedPass);
  if (!userOk || !passOk) {
    return new NextResponse("Invalid credentials", {
      status: 401,
      headers: { "WWW-Authenticate": `Basic realm="${REALM}"`, "Cache-Control": "no-store" },
    });
  }

  return null;
}
