"use client";

import { Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

function catalogSearchAction(pathname: string | null): string {
  if (pathname && pathname.startsWith("/catalog/")) return pathname;
  return "/catalog/barchasi";
}

export function HeaderSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const action = catalogSearchAction(pathname);
  const defaultQ = searchParams.get("q") ?? "";

  return (
    <>
      <form
        action={action}
        method="get"
        className="relative mx-auto hidden min-w-0 flex-1 sm:block"
        role="search"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          key={`${pathname}-d-${defaultQ}`}
          name="q"
          type="search"
          defaultValue={defaultQ}
          placeholder="Поиск товара…"
          autoComplete="off"
          className="h-10 w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none ring-brand/30 transition placeholder:text-zinc-400 focus:border-brand focus:bg-white focus:ring-2"
        />
      </form>

      <form action={action} method="get" className="relative flex-1 sm:hidden" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          key={`${pathname}-m-${defaultQ}`}
          name="q"
          type="search"
          defaultValue={defaultQ}
          placeholder="Поиск…"
          autoComplete="off"
          className="h-10 w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </form>
    </>
  );
}
