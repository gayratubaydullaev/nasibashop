"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/store", label: "Do‘kon", icon: LayoutDashboard, end: true },
  { href: "/store/products", label: "Mahsulotlar", icon: Package },
  { href: "/store/orders", label: "Buyurtmalar", icon: ShoppingCart },
];

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-zinc-100">
      <aside className="hidden w-52 shrink-0 border-r border-zinc-200 bg-white lg:block">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Store manager</p>
          <p className="mt-1 text-sm font-bold text-zinc-900">Mening do‘konim</p>
        </div>
        <nav className="space-y-0.5 px-2 pb-6">
          {nav.map((item) => {
            const active = item.end ? pathname === item.href : pathname.startsWith(item.href);
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
      <div className="min-w-0 flex-1">
        <header className="border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <p className="text-sm font-semibold">Do‘kon paneli</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border px-2 py-1 text-xs">
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
