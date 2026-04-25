export default function StoreDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">Do‘kon dashboard</h1>
      <p className="text-sm text-zinc-600">Faqat o‘z do‘koningiz statistikasi (keyinroq API).</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Bugungi buyurtmalar</p>
          <p className="mt-2 text-3xl font-bold text-brand">—</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-500">Tushum</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">—</p>
        </div>
      </div>
    </div>
  );
}
