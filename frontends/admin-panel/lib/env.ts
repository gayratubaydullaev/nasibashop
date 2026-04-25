export function getPublicApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:8000";
}
