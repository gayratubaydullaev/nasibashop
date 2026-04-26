"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/admin/mobile-bottom-nav";
import { LogoutButton } from "@/components/auth/logout-button";
import { getStoreNavFlat, getStoreNavGroups } from "@/components/admin/store-nav";
import { isNavActive } from "@/components/admin/nav-active";

const skipLinkClass =
  "sr-only z-[100] rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-lg outline-none ring-2 ring-violet-500 ring-offset-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4";

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const flatNav = getStoreNavFlat();
  const navGroups = getStoreNavGroups();
  const storeId = process.env.NEXT_PUBLIC_STORE_ID?.trim();

  return (
    <>
      <a href="#store-shell-main" className={skipLinkClass}>
        К основному содержимому
      </a>
      <div className="flex min-h-screen min-h-[100dvh] bg-zinc-100">
        <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:max-h-screen lg:flex-col">
          <div className="shrink-0 p-4">
            <Link
              href="/store"
              className="block rounded-xl outline-none ring-violet-500/30 transition hover:bg-zinc-50 focus-visible:ring-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Продавец</p>
              <p className="mt-0.5 text-base font-bold text-zinc-900">Панель магазина</p>
            </Link>
          </div>
          <nav
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-2"
            aria-label="Меню продавца"
          >
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isNavActive(pathname, item);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30",
                            active ? "bg-violet-50 text-violet-700" : "text-zinc-600 hover:bg-zinc-50",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="shrink-0 space-y-2 border-t border-zinc-100 px-2 py-4">
            {storeId ? (
              <p className="truncate px-2 text-[10px] leading-tight text-zinc-400" title={storeId}>
                Магазин: <span className="font-mono text-zinc-500">{storeId}</span>
              </p>
            ) : (
              <p className="px-2 text-[10px] leading-tight text-amber-700/90">
                Задайте <span className="font-mono">NEXT_PUBLIC_STORE_ID</span> для заказов и контекста.
              </p>
            )}
            <LogoutButton />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col pb-0">
          <header
            className="sticky top-0 z-30 flex items-start justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <Link href="/store" className="min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40">
              <p className="text-sm font-semibold text-zinc-900">Панель магазина</p>
              <p className="text-xs text-zinc-500">Продавец</p>
            </Link>
            <div className="w-28 shrink-0">
              <LogoutButton />
            </div>
          </header>
          <main
            id="store-shell-main"
            tabIndex={-1}
            className="max-w-7xl flex-1 scroll-mt-4 self-stretch p-3 pb-[max(1.5rem,calc(5.75rem+env(safe-area-inset-bottom,0px)))] outline-none sm:p-4 lg:mx-auto lg:w-full lg:p-6"
          >
            {children}
          </main>
          <MobileBottomNav items={flatNav} variant="store" aria-label="Меню продавца" />
        </div>
      </div>
    </>
  );
}
