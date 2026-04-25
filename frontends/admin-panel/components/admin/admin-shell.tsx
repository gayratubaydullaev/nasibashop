"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, Package, ShoppingCart, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { href: "/admin/orders", label: "Buyurtmalar", icon: ShoppingCart },
  { href: "/admin/payments", label: "To‘lovlar", icon: CreditCard },
  { href: "/admin/products", label: "Mahsulotlar", icon: Package },
  { href: "/admin/stores", label: "Do‘konlar", icon: Store },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-zinc-100">
      <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white lg:block">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Super admin</p>
          <p className="mt-1 text-sm font-bold text-zinc-900">NasibaShop</p>
        </div>
        <nav className="space-y-0.5 px-2 pb-6">
          {adminNav.map((item) => {
            const active = item.end ? pathname === item.href : pathname.startsWith(item.href);
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
      <div className="min-w-0 flex-1">
        <header className="border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <p className="text-sm font-semibold text-zinc-900">Admin</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
