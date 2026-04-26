import Link from "next/link";
import { CirclePlus, LayoutDashboard, Package, ShoppingCart } from "lucide-react";

const quickLinks = [
  { href: "/store/products", label: "Товары", hint: "Список и редактирование", icon: Package },
  { href: "/store/products/create", label: "Новый товар", hint: "Создание карточки и SKU", icon: CirclePlus },
  { href: "/store/orders", label: "Заказы", hint: "Заказы вашего магазина", icon: ShoppingCart },
] as const;

export default function StoreDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-violet-600" aria-hidden />
          <h1 className="text-2xl font-bold text-zinc-900">Обзор</h1>
        </div>
        <p className="max-w-xl text-sm text-zinc-600">
          Быстрые действия и сводка. Метрики ниже подключатся к API позже.
        </p>
      </header>

      <section aria-labelledby="store-quick-links">
        <h2 id="store-quick-links" className="sr-only">
          Быстрые ссылки
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ href, label, hint, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm outline-none transition hover:border-violet-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-500/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Заказы сегодня</p>
          <p className="mt-2 text-3xl font-bold text-violet-600">—</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Выручка</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">—</p>
        </div>
      </div>
    </div>
  );
}
