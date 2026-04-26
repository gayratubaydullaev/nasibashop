import {
  CreditCard,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import type { ShellNavItem } from "@/components/admin/nav-types";

type AdminNavGroupId = "overview" | "sales" | "catalog" | "directory";

const GROUP_LABELS: Record<AdminNavGroupId, string> = {
  overview: "Обзор",
  sales: "Продажи",
  catalog: "Каталог",
  directory: "Справочники",
};

type AdminNavItem = ShellNavItem & { group: AdminNavGroupId };

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { group: "overview", href: "/admin", label: "Дашборд", icon: LayoutDashboard, end: true },
  { group: "sales", href: "/admin/orders", label: "Заказы", icon: ShoppingCart },
  { group: "sales", href: "/admin/payments", label: "Платежи", icon: CreditCard },
  { group: "catalog", href: "/admin/products", label: "Товары", icon: Package },
  { group: "directory", href: "/admin/stores", label: "Магазины", icon: Store },
  { group: "directory", href: "/admin/users", label: "Пользователи", icon: Users },
];

const GROUP_ORDER: AdminNavGroupId[] = ["overview", "sales", "catalog", "directory"];

export function getAdminNavGroups(): { title: string; items: AdminNavItem[] }[] {
  return GROUP_ORDER.map((id) => ({
    title: GROUP_LABELS[id],
    items: ADMIN_NAV_ITEMS.filter((i) => i.group === id),
  }));
}

export function getAdminNavFlat(): ShellNavItem[] {
  return ADMIN_NAV_ITEMS.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
    ...(item.end ? { end: item.end } : {}),
  }));
}
