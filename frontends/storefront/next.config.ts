import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Monorepo: aniq vitrina ildizi (bitta root package-lock xatosini yechmaydi, lekin Turbopack to‘g‘ri loyiha katalogini tanlaydi)
  turbopack: {
    root: appDir,
  },
  // next dev: nginx orqali boshqa domen; kelajakdagi CORS / _next so‘rovlari uchun
  allowedDevOrigins: [
    "https://shop.blungur.store",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
      { protocol: "https", hostname: "shop.blungur.store", pathname: "/**" },
    ],
  },
};

export default nextConfig;
