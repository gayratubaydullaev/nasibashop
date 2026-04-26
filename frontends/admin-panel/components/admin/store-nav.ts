import { CirclePlus, LayoutDashboard, Package, ShoppingCart } from "lucide-react";
import type { ShellNavItem } from "@/components/admin/nav-types";

type StoreNavGroupId = "overview" | "sales" | "catalog";

const GROUP_LABELS: Record<StoreNavGroupId, string> = {
  overview: "Обзор",
  sales: "Продажи",
  catalog: "Каталог",
};

type StoreNavItem = ShellNavItem & { group: StoreNavGroupId };

const STORE_NAV: StoreNavItem[] = [
  { group: "overview", href: "/store", label: "Обзор", icon: LayoutDashboard, end: true },
  { group: "sales", href: "/store/orders", label: "Заказы", icon: ShoppingCart },
  {
    group: "catalog",
    href: "/store/products",
    label: "Товары",
    icon: Package,
    matches: (p) =>
      p !== "/store/products/create" && (p === "/store/products" || p.startsWith("/store/products/")),
  },
  {
    group: "catalog",
    href: "/store/products/create",
    label: "Новый товар",
    icon: CirclePlus,
    end: true,
  },
];

const GROUP_ORDER: StoreNavGroupId[] = ["overview", "sales", "catalog"];

export function getStoreNavGroups(): { title: string; items: StoreNavItem[] }[] {
  return GROUP_ORDER.map((id) => ({
    title: GROUP_LABELS[id],
    items: STORE_NAV.filter((i) => i.group === id),
  }));
}

export function getStoreNavFlat(): ShellNavItem[] {
  return STORE_NAV.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
    ...(item.end ? { end: item.end } : {}),
    ...(item.matches ? { matches: item.matches } : {}),
  }));
}
