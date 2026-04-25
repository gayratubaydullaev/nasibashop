"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

const items = [
  { href: "/", label: "Bosh sahifa", icon: Home, end: true },
  { href: "/catalog/barchasi", label: "Katalog", icon: LayoutGrid, end: false },
  { href: "/cart", label: "Savatcha", icon: ShoppingBag, end: false },
  { href: "/profile", label: "Profil", icon: User, end: false },
] as const;

function isActive(pathname: string, item: (typeof items)[number]) {
  if (item.end) return pathname === item.href;
  if (item.href === "/catalog/barchasi") {
    return pathname === "/catalog/barchasi" || pathname.startsWith("/catalog/");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const totalQty = useCartStore((s) => s.lines.reduce((n, l) => n + l.qty, 0));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/90 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
      aria-label="Asosiy navigatsiya"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1 pt-1">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          const showBadge = item.href === "/cart" && totalQty > 0;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium leading-tight transition active:scale-[0.98] sm:text-xs",
                  active ? "text-brand" : "text-zinc-500",
                )}
                style={{ touchAction: "manipulation" }}
              >
                <span className="relative">
                  <Icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={active ? 2.25 : 2} />
                  {showBadge ? (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                      {totalQty > 99 ? "99+" : totalQty}
                    </span>
                  ) : null}
                </span>
                <span className="line-clamp-1 w-full text-center">{item.label}</span>
                {active ? (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-brand" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
