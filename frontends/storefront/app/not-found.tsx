import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="mt-2 text-xl font-semibold text-zinc-900">Sahifa topilmadi</h1>
      <Link href="/" className="mt-6 rounded-2xl bg-brand px-6 py-2.5 text-sm font-semibold text-white">
        Bosh sahifa
      </Link>
    </div>
  );
}
