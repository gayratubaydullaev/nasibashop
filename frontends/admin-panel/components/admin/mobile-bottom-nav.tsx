"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ShellNavItem } from "@/components/admin/nav-types";
import { isNavActive } from "@/components/admin/nav-active";
import { cn } from "@/lib/utils";

/** @deprecated используйте ShellNavItem из nav-types */
export type MobileNavItem = ShellNavItem;

type ShellVariant = "admin" | "store";

const activeStyles: Record<ShellVariant, { active: string; inactive: string; dot: string }> = {
  admin: {
    active: "text-brand",
    inactive: "text-zinc-500",
    dot: "bg-brand",
  },
  store: {
    active: "text-violet-700",
    inactive: "text-zinc-500",
    dot: "bg-violet-600",
  },
};

type Props = {
  items: ShellNavItem[];
  variant: ShellVariant;
  "aria-label"?: string;
};

export function MobileBottomNav({ items, variant, "aria-label": aria = "Навигация" }: Props) {
  const pathname = usePathname();
  const s = activeStyles[variant];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/90 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden"
      aria-label={aria}
    >
      <ul className="flex max-w-3xl snap-x snap-mandatory items-stretch justify-start gap-0.5 overflow-x-auto px-1 pt-1 scrollbar-none sm:mx-auto sm:justify-center">
        {items.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="min-w-[4.5rem] shrink-0 snap-center sm:min-w-[5.5rem]">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[3.25rem] min-w-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center text-[10px] font-medium leading-tight transition active:scale-[0.98] sm:min-w-[4.5rem] sm:text-xs",
                  active ? s.active : s.inactive,
                )}
                style={{ touchAction: "manipulation" }}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
                <span className="line-clamp-2 w-full max-w-[5.5rem] break-words">{item.label}</span>
                {active ? (
                  <span
                    className={cn("absolute bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full", s.dot)}
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
