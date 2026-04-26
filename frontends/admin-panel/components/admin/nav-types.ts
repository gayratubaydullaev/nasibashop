import type { LucideIcon } from "lucide-react";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** true — активен только при точном совпадении пути */
  end?: boolean;
  /** Если задано, подменяет стандартную логику active (префикс / точное совпадение) */
  matches?: (pathname: string) => boolean;
};
