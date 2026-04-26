import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NasibaShop — интернет-магазин",
  description: "Маркетплейс: каталог, доставка, удобная оплата.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen min-h-[100dvh] font-sans antialiased md:min-h-0`}
      >
        <Providers>
          <a
            href="#site-main"
            className="sr-only z-[100] rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-lg outline-none ring-2 ring-brand ring-offset-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            К основному содержимому
          </a>
          <SiteHeader />
          <main
            id="site-main"
            tabIndex={-1}
            className="mx-auto min-h-[50vh] max-w-6xl px-3 pb-6 pt-4 outline-none sm:px-5 sm:pb-8 sm:pt-5 md:min-h-[60vh] md:px-6 md:pb-12 md:pt-6"
          >
            {children}
          </main>
          <SiteFooter />
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
