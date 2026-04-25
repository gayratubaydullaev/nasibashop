"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/admin/mobile-bottom-nav";
import type { MobileNavItem } from "@/components/admin/mobile-bottom-nav";

const storeNav: MobileNavItem[] = [
  { href: "/store", label: "Do‘kon", icon: LayoutDashboard, end: true },
  { href: "/store/products", label: "Mahsulotlar", icon: Package },
  { href: "/store/orders", label: "Buyurtmalar", icon: ShoppingCart },
];

function navActive(pathname: string, item: MobileNavItem) {
  return item.end
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-zinc-100">
      <aside className="hidden w-52 shrink-0 border-r border-zinc-200 bg-white lg:block">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Store manager</p>
          <p className="mt-1 text-sm font-bold text-zinc-900">Mening do‘konim</p>
        </div>
        <nav className="space-y-0.5 px-2 pb-6">
          {storeNav.map((item) => {
            const active = navActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active ? "bg-violet-50 text-violet-700" : "text-zinc-600 hover:bg-zinc-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 pb-0">
        <header
          className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <p className="text-sm font-semibold text-zinc-900">Do‘kon paneli</p>
          <p className="text-xs text-zinc-500">Mening do‘konim</p>
        </header>
        <div className="p-3 pb-[max(1.5rem,calc(5.75rem+env(safe-area-inset-bottom,0px)))] sm:p-4 lg:p-6">
          {children}
        </div>
        <MobileBottomNav items={storeNav} variant="store" />
      </div>
    </div>
  );
}
