import Link from "next/link";
import {
  CreditCard,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { DashboardChart } from "@/components/admin/dashboard-chart";

const quickLinks = [
  {
    href: "/admin/orders",
    label: "Заказы",
    hint: "Статусы, фильтры",
    icon: ShoppingCart,
  },
  {
    href: "/admin/payments",
    label: "Платежи",
    hint: "Операции",
    icon: CreditCard,
  },
  {
    href: "/admin/products",
    label: "Товары",
    hint: "Каталог и SKU",
    icon: Package,
  },
  {
    href: "/admin/stores",
    label: "Магазины",
    hint: "Точки продаж",
    icon: Store,
  },
  {
    href: "/admin/users",
    label: "Пользователи",
    hint: "Учётные записи",
    icon: Users,
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-brand" aria-hidden />
          <h1 className="text-2xl font-bold text-zinc-900">Дашборд</h1>
        </div>
        <p className="max-w-2xl text-sm text-zinc-600">
          Быстрый переход в разделы. Блоки ниже — заглушки до подключения аналитики из order-service и payment.
        </p>
      </header>

      <section aria-labelledby="admin-quick-links">
        <h2 id="admin-quick-links" className="sr-only">
          Быстрые ссылки
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map(({ href, label, hint, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm outline-none transition hover:border-brand/35 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-zinc-900">{label}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DashboardChart />

      <div className="grid gap-4 sm:grid-cols-3">
        {["Заказы", "Конверсия", "Средний чек"].map((t) => (
          <div key={t} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
