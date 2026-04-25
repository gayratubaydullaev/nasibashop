import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NasibaShop — onlayn do‘kon",
  description: "O‘zbekiston uchun marketplace: katalog, yetkazib berish, qulay to‘lov.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}>
        <Providers>
          <SiteHeader />
          <main className="mx-auto min-h-[60vh] max-w-6xl px-4 pb-12 pt-6 sm:px-6">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
