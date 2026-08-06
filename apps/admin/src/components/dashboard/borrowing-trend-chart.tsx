"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { BorrowingTrendPoint } from "@/lib/api/reports";

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white shadow-lg ring-1 ring-slate-200 px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.name}: <span className="font-bold ml-0.5">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function BorrowingTrendChart({ data }: { data: BorrowingTrendPoint[] }) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
  }));

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <div className="border-b border-slate-100/70 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Xu hướng Mượn / Trả Sách</h2>
        <p className="mt-0.5 text-sm text-slate-500">30 ngày gần nhất · Sách giấy tại quầy</p>
      </div>
      <div className="p-5">
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Chưa có dữ liệu mượn/trả.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="borrowCount"
                  name="Sách mượn"
                  fill="#bfdbfe"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="returnCount"
                  name="Sách trả"
                  fill="#bbf7d0"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Line
                  type="monotone"
                  dataKey="borrowCount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="returnCount"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  legendType="none"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
