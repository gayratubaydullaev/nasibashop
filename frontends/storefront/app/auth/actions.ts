"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicApiUrl } from "@/lib/env";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/auth/constants";

type Tokens = {
  accessToken: string;
  refreshToken: string;
  accessExpiresInSeconds: number;
  refreshExpiresInSeconds: number;
  tokenType: string;
};

export type AuthFormState = { message?: string };

function cookieBase() {
  const secure = process.env.NODE_ENV === "production";
  return { path: "/", sameSite: "lax" as const, secure, httpOnly: true };
}

async function setTokenCookies(tokens: Tokens) {
  const jar = await cookies();
  const baseOpts = cookieBase();
  jar.set(COOKIE_ACCESS, tokens.accessToken, {
    ...baseOpts,
    maxAge: Math.max(60, tokens.accessExpiresInSeconds || 900),
  });
  jar.set(COOKIE_REFRESH, tokens.refreshToken, {
    ...baseOpts,
    maxAge: Math.max(3600, tokens.refreshExpiresInSeconds || 604800),
  });
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { message: "Введите email и пароль" };

  const base = getPublicApiUrl();
  let tokens: Tokens;
  try {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { message: text || `Ошибка входа (${res.status})` };
    const data = JSON.parse(text) as { tokens?: Tokens };
    if (!data.tokens?.accessToken || !data.tokens?.refreshToken) return { message: "В ответе нет токенов" };
    tokens = data.tokens;
  } catch (e) {
    return { message: e instanceof Error ? e.message : "Сеть" };
  }

  await setTokenCookies(tokens);
  const next = String(formData.get("next") ?? "").trim();
  if (next.startsWith("/") && !next.startsWith("//")) redirect(next);
  redirect("/");
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!fullName || !email || !password) return { message: "Заполните имя, email и пароль" };

  const base = getPublicApiUrl();
  let tokens: Tokens;
  try {
    const res = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { message: text || `Ошибка регистрации (${res.status})` };
    const data = JSON.parse(text) as { tokens?: Tokens };
    if (!data.tokens?.accessToken || !data.tokens?.refreshToken) return { message: "В ответе нет токенов" };
    tokens = data.tokens;
  } catch (e) {
    return { message: e instanceof Error ? e.message : "Сеть" };
  }

  await setTokenCookies(tokens);
  const next = String(formData.get("next") ?? "").trim();
  if (next.startsWith("/") && !next.startsWith("//")) redirect(next);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_ACCESS);
  jar.delete(COOKIE_REFRESH);
  redirect("/login");
}
