import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-zinc-900">NasibaShop</p>
            <p className="mt-2 max-w-sm text-sm text-zinc-600">
              O‘zbekiston bozori uchun zamonaviy marketplace. Tez yetkazib berish va qulay to‘lov.
            </p>
          </div>
          <div className="flex flex-wrap gap-8 text-sm">
            <div>
              <p className="font-medium text-zinc-900">Xaridor</p>
              <ul className="mt-2 space-y-1 text-zinc-600">
                <li>
                  <Link href="/catalog/barchasi" className="hover:text-brand">
                    Katalog
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-brand">
                    Profil
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Ma’lumot</p>
              <ul className="mt-2 space-y-1 text-zinc-600">
                <li>
                  <Link href="/checkout" className="hover:text-brand">
                    Buyurtma
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-500">© {new Date().getFullYear()} NasibaShop</p>
      </div>
    </footer>
  );
}
