"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const demo = [
  { name: "Пн", sales: 4200 },
  { name: "Вт", sales: 3800 },
  { name: "Ср", sales: 5100 },
  { name: "Чт", sales: 4600 },
  { name: "Пт", sales: 6200 },
  { name: "Сб", sales: 5800 },
  { name: "Вс", sales: 7100 },
];

export function DashboardChart() {
  return (
    <div className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-medium text-zinc-700">Продажи (демо)</p>
      <div className="w-full min-w-0">
        <ResponsiveContainer width="100%" height={280} minWidth={0}>
          <AreaChart data={demo} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillBrand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7000FF" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7000FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#71717a" />
          <YAxis tick={{ fontSize: 12 }} stroke="#71717a" />
          <Tooltip />
          <Area type="monotone" dataKey="sales" stroke="#7000FF" fill="url(#fillBrand)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
