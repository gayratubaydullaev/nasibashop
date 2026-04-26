import type { ShellNavItem } from "@/components/admin/nav-types";

export function isNavActive(pathname: string, item: ShellNavItem): boolean {
  if (item.matches) return item.matches(pathname);
  if (item.end) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
