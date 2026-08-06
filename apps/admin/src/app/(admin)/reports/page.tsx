"use client";

import { useCallback } from "react";
import { useAsync } from "@/hooks/use-async";
import { reportsApi, statisticsApi, type StatusCount, type FineSummary, type BorrowingTrendPoint } from "@/lib/api/reports";
import { paymentsApi } from "@/lib/api/payments";
import { ErrorState } from "@/components/ui/error-state";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
} from "recharts";
import {
  DollarSign,
  BookOpen,
  Users,
  RefreshCcw,
  AlertTriangle,
  TrendingUp,
  FileText,
} from "lucide-react";

// ─── Color palettes ────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "#3b82f6",
  DRAFT:     "#94a3b8",
  ARCHIVED:  "#64748b",
  ACTIVE:    "#10b981",
  INACTIVE:  "#f59e0b",
  SUSPENDED: "#ef4444",
  CLOSED:    "#10b981",
  OPEN:      "#3b82f6",
  OVERDUE:   "#ef4444",
  PAID:      "#10b981",
  UNPAID:    "#f59e0b",
  WAIVED:    "#94a3b8",
  DEFAULT:   "#a78bfa",
};

function colorFor(status: string, idx: number): string {
  return STATUS_COLORS[status] ?? ["#3b82f6","#10b981","#f59e0b","#ef4444","#a78bfa","#64748b"][idx % 6];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// ─── Sub-components ────────────────────────────────────────────

// Stat card
function StatCard({
  label, value, icon, accent,
}: { label: string; value: string | number; icon: React.ReactNode; accent: string }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-5 flex items-center gap-4`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// Donut chart panel
function DonutPanel({ title, rows }: { title: string; rows: StatusCount[] }) {
  if (!rows.length) return null;
  const total = rows.reduce((s, r) => s + r.count, 0);
  const data = rows.map((r) => ({ name: r.status, value: r.count }));

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <div className="border-b border-slate-100/70 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">Tổng: {total.toLocaleString("vi-VN")}</p>
      </div>
      <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
        {/* Donut */}
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, idx) => (
                  <Cell key={entry.name} fill={colorFor(entry.name, idx)} />
                ))}
              </Pie>
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`${v ?? 0} (${(((Number(v) || 0) / total) * 100).toFixed(1)}%)`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend list */}
        <div className="flex-1 space-y-2 w-full">
          {rows.map((r, idx) => (
            <div key={r.status} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: colorFor(r.status, idx) }}
                />
                <span className="text-slate-600 font-medium">{r.status}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{r.count.toLocaleString("vi-VN")}</span>
                <span className="text-xs text-slate-400 w-12 text-right">
                  {((r.count / total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Fines bar chart panel
function FinesPanel({ rows }: { rows: FineSummary[] }) {
  if (!rows.length) return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-5">
      <h2 className="text-base font-semibold text-slate-900">Tiền phạt theo trạng thái</h2>
      <p className="mt-4 text-sm text-slate-400">Chưa có dữ liệu tiền phạt.</p>
    </div>
  );

  const data = rows.map((r) => ({
    name: r.status,
    "Số đơn": r.count,
    "Tổng tiền (×1000₫)": Math.round(r.totalAmount / 1000),
  }));

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <div className="border-b border-slate-100/70 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Tiền phạt theo trạng thái</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tổng: {rows.reduce((s, r) => s + r.totalAmount, 0).toLocaleString("vi-VN")}₫ · {rows.reduce((s, r) => s + r.count, 0)} đơn
        </p>
      </div>
      <div className="p-5">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, name: any) =>
                  name === "Tổng tiền (×1000₫)" ? [`${((Number(v) || 0) * 1000).toLocaleString("vi-VN")}₫`, "Tổng tiền"] : [v ?? 0, name ?? ""]
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
              <Bar dataKey="Số đơn" fill="#a78bfa" radius={[4,4,0,0]} maxBarSize={40} />
              <Bar dataKey="Tổng tiền (×1000₫)" fill="#fb923c" radius={[4,4,0,0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Borrowing trend chart
function TrendPanel({ data }: { data: BorrowingTrendPoint[] }) {
  const chartData = data.map((p) => ({ ...p, label: formatDate(p.date) }));
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <div className="border-b border-slate-100/70 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Xu hướng Mượn / Trả sách</h2>
        <p className="text-xs text-slate-500 mt-0.5">30 ngày gần nhất · Sách giấy tại quầy</p>
      </div>
      <div className="p-5">
        {chartData.length === 0 ? (
          <div className="flex h-52 items-center justify-center text-sm text-slate-400">
            Chưa có dữ liệu mượn/trả.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                <Bar dataKey="borrowCount" name="Sách mượn" fill="#bfdbfe" radius={[4,4,0,0]} maxBarSize={28} />
                <Bar dataKey="returnCount" name="Sách trả" fill="#bbf7d0" radius={[4,4,0,0]} maxBarSize={28} />
                <Line type="monotone" dataKey="borrowCount" stroke="#3b82f6" strokeWidth={2} dot={false} legendType="none" />
                <Line type="monotone" dataKey="returnCount" stroke="#10b981" strokeWidth={2} dot={false} legendType="none" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function ReportsPage() {
  const fetcher = useCallback(async () => {
    const [breakdowns, revenue, trend] = await Promise.all([
      statisticsApi.getSummary(),
      paymentsApi.revenue(),
      reportsApi.trend(),
    ]);
    return { breakdowns, revenue, trend };
  }, []);

  const { data, error, isLoading, retry } = useAsync(fetcher);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-100" />)}
        </div>
      </div>
    );
  }

  if (error || !data) return <ErrorState message="Không thể tải báo cáo." onRetry={retry} />;

  const { breakdowns, revenue, trend } = data;
  const totalFineAmount = breakdowns.fineSummary.reduce((s, r) => s + r.totalAmount, 0);
  const totalBorrowings = breakdowns.borrowingStatusBreakdown.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Báo cáo & Thống kê</h1>
        <p className="mt-1 text-sm text-slate-500">Tổng quan hoạt động thư viện, doanh thu và xu hướng mượn trả.</p>
      </div>

      {/* Top stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng doanh thu"
          value={`${revenue.totalRevenue.toLocaleString("vi-VN")}₫`}
          icon={<DollarSign className="h-5 w-5" />}
          accent="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Doanh thu hôm nay"
          value={`${revenue.todayRevenue.toLocaleString("vi-VN")}₫`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Tổng giao dịch"
          value={revenue.totalOrdersCount.toLocaleString("vi-VN")}
          icon={<FileText className="h-5 w-5" />}
          accent="bg-violet-100 text-violet-600"
        />
        <StatCard
          label="Tổng tiền phạt"
          value={`${totalFineAmount.toLocaleString("vi-VN")}₫`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="bg-rose-100 text-rose-600"
        />
      </div>

      {/* Secondary stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng phiếu mượn"
          value={totalBorrowings.toLocaleString("vi-VN")}
          icon={<RefreshCcw className="h-5 w-5" />}
          accent="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Sách đang mượn (OPEN)"
          value={(breakdowns.borrowingStatusBreakdown.find(r => r.status === "OPEN")?.count ?? 0).toLocaleString("vi-VN")}
          icon={<BookOpen className="h-5 w-5" />}
          accent="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Người dùng đang hoạt động"
          value={(breakdowns.userStatusBreakdown.find(r => r.status === "ACTIVE")?.count ?? 0).toLocaleString("vi-VN")}
          icon={<Users className="h-5 w-5" />}
          accent="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* Borrowing Trend Chart – full width */}
      <TrendPanel data={trend} />

      {/* Donut charts grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DonutPanel title="Sách theo trạng thái" rows={breakdowns.bookStatusBreakdown} />
        <DonutPanel title="Người dùng theo trạng thái" rows={breakdowns.userStatusBreakdown} />
        <DonutPanel title="Phiếu mượn theo trạng thái" rows={breakdowns.borrowingStatusBreakdown} />
      </div>

      {/* Fines bar chart – full width */}
      <FinesPanel rows={breakdowns.fineSummary} />
    </div>
  );
}
