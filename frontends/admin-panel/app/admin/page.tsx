import { DashboardChart } from "@/components/admin/dashboard-chart";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <p className="text-sm text-zinc-600">
        Keyinroq: order-service va payment aggregatsiya. Hozircha namuna grafik (Recharts).
      </p>
      <DashboardChart />
      <div className="grid gap-4 sm:grid-cols-3">
        {["Buyurtmalar", "Konversiya", "O‘rtacha chek"].map((t) => (
          <div key={t} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-zinc-500">{t}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
