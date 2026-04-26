import { cookies } from "next/headers";
import { COOKIE_ACCESS } from "@/lib/auth/constants";

/** Bearer для Server Actions и ручных fetch: сначала access из cookie, иначе сервисный JWT. */
export async function resolveGatewayBearer(): Promise<string | null> {
  const jar = await cookies();
  const user = jar.get(COOKIE_ACCESS)?.value?.trim();
  if (user) return user;
  return process.env.API_GATEWAY_JWT?.trim() || null;
}
