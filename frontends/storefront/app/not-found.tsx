import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold tabular-nums text-brand">404</p>
      <h1 className="mt-2 text-xl font-semibold text-zinc-900">Страница не найдена</h1>
      <p className="mt-3 max-w-md text-sm text-zinc-600">
        Ссылка устарела или адрес набран с ошибкой. Перейдите в каталог или на главную.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="rounded-2xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-violet-700">
          На главную
        </Link>
        <Link
          href="/catalog/barchasi"
          className="rounded-2xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 hover:border-brand/40 hover:text-brand"
        >
          В каталог
        </Link>
      </div>
    </div>
  );
}
