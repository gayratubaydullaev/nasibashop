import { fetchJson } from "@/lib/api/fetch-json";
import type { SavedAddress, UserProfile } from "@/types/user";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const data = await fetchJson<{ user: UserProfile }>(`/api/users/${userId}`, { cache: "no-store" });
  return data?.user ?? null;
}

export async function getUserAddresses(userId: string): Promise<SavedAddress[]> {
  const data = await fetchJson<{ addresses: SavedAddress[] }>(`/api/users/${userId}/addresses`, {
    cache: "no-store",
  });
  return data?.addresses ?? [];
}
