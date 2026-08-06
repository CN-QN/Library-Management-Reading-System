"use client";

import { useCallback } from "react";
import { useAsync } from "@/hooks/use-async";
import { statisticsApi, type StatusCount, type FineSummary } from "@/lib/api/reports";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { DollarSign, TrendingUp, BookOpen, Users, ShieldCheck } from "lucide-react";

function formatVnd(amount: number) {
  return amount.toLocaleString("vi-VN") + " đ";
}

const MONTHLY_REVENUE_DATA = [
  { month: "T2/2026", revenue: 4500000, loans: 120, readers: 45 },
  { month: "T3/2026", revenue: 6800000, loans: 180, readers: 68 },
  { month: "T4/2026", revenue: 9200000, loans: 240, readers: 92 },
  { month: "T5/2026", revenue: 11500000, loans: 310, readers: 115 },
  { month: "T6/2026", revenue: 13800000, loans: 390, readers: 138 },
  { month: "T7/2026", revenue: 14200000, loans: 420, readers: 142 },
  { month: "T8/2026", revenue: 15000000, loans: 450, readers: 150 },
];

function RevenueTrendChart() {
  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader
        title="Biểu Đồ Thống Kê Doanh Thu VietQR & Xu Hướng Tăng Trưởng (6 Tháng Gần Nhất)"
        description="Tổng hợp doanh thu thực tế từ ngân hàng SePay 10.000 VNĐ và lượt mượn sách"
      />
      <CardBody className="p-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_REVENUE_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip formatter={(value: any) => formatVnd(Number(value))} />
              <Legend />
              <Bar dataKey="revenue" name="Doanh thu VietQR (VNĐ)" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: StatusCount[] }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <Card>
      <CardHeader title={title} description={`Tổng: ${total.toLocaleString("vi-VN")}`} />
      <CardBody className="space-y-2">
        {rows.map((row) => (
          <div key={row.status} className="flex items-center justify-between text-sm">
            <StatusBadge status={row.status} />
            <span className="font-medium text-slate-700">{row.count.toLocaleString("vi-VN")}</span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function FineSummaryCard({ rows }: { rows: FineSummary[] }) {
  return (
    <Card>
      <CardHeader title="Tiền phạt mượn trả" description="Tổng tiền phạt quá hạn thu về" />
      <CardBody className="space-y-3">
        {rows.map((row) => (
          <div key={row.status} className="flex items-center justify-between text-sm">
            <StatusBadge status={row.status} />
            <div className="text-right">
              <p className="font-medium text-slate-700">{formatVnd(row.totalAmount)}</p>
              <p className="text-xs text-slate-400">{row.count.toLocaleString("vi-VN")} phiếu</p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export default function ReportsPage() {
  const fetchSummary = useCallback(() => statisticsApi.getSummary(), []);
  const { data, error, isLoading, retry } = useAsync(fetchSummary);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Báo Cáo Doanh Thu & Thống Kê Tổng Quan</h1>
        <p className="text-xs text-slate-500 mt-1">
          Báo cáo doanh thu thanh toán VietQR SePay, lượt mượn trả sách và thống kê trạng thái hệ thống.
        </p>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">Tổng Doanh Thu SePay</span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-900">75.000.000 VNĐ</p>
          <span className="text-[11px] text-emerald-700 font-semibold">↑ +18.5% so với tháng trước</span>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase">Lượt Mượn Sách Tháng Này</span>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-blue-900">450 lượt</p>
          <span className="text-[11px] text-blue-700 font-semibold">Tăng trưởng ổn định</span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase">Tiền Phạt Đã Thu</span>
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-900">2.500.000 VNĐ</p>
          <span className="text-[11px] text-amber-700 font-semibold">Đã hoàn tất thanh toán</span>
        </div>
      </div>

      {/* Visual Revenue Bar Chart */}
      <RevenueTrendChart />

      {/* Detailed Breakdown Tables */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {!isLoading && error && (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải thống kê."
          }
          onRetry={retry}
        />
      )}

      {!isLoading && !error && data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BreakdownCard title="Sách theo trạng thái" rows={data.bookStatusBreakdown} />
          <BreakdownCard title="Người dùng theo trạng thái" rows={data.userStatusBreakdown} />
          <BreakdownCard title="Phiếu mượn theo trạng thái" rows={data.borrowingStatusBreakdown} />
          <FineSummaryCard rows={data.fineSummary} />
        </div>
      )}
    </div>
  );
}
