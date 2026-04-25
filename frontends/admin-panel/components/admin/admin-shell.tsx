"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, Package, ShoppingCart, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/admin/mobile-bottom-nav";
import type { MobileNavItem } from "@/components/admin/mobile-bottom-nav";

const adminNav: MobileNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { href: "/admin/orders", label: "Buyurtmalar", icon: ShoppingCart },
  { href: "/admin/payments", label: "To‘lovlar", icon: CreditCard },
  { href: "/admin/products", label: "Mahsulotlar", icon: Package },
  { href: "/admin/stores", label: "Do‘konlar", icon: Store },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
];

function navActive(pathname: string, item: MobileNavItem) {
  return item.end
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-zinc-100">
      <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white lg:block">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Super admin</p>
          <p className="mt-1 text-sm font-bold text-zinc-900">NasibaShop</p>
        </div>
        <nav className="space-y-0.5 px-2 pb-6">
          {adminNav.map((item) => {
            const active = navActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active ? "bg-brand/10 text-brand" : "text-zinc-600 hover:bg-zinc-50",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
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
          <p className="text-sm font-semibold text-zinc-900">Super admin</p>
          <p className="text-xs text-zinc-500">NasibaShop</p>
        </header>
        <div className="max-w-7xl p-3 pb-[max(1.5rem,calc(5.75rem+env(safe-area-inset-bottom,0px)))] sm:p-4 lg:mx-auto lg:max-w-none lg:p-6">
          {children}
        </div>
        <MobileBottomNav items={adminNav} variant="admin" />
      </div>
    </div>
  );
}
