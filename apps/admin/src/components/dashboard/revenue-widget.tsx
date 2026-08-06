"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

interface RevenueStats {
  totalRevenue: number;
  todayRevenue: number;
  successOrdersCount: number;
  pendingOrdersCount: number;
}

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export function RevenueWidget() {
  const [stats, setStats] = useState<RevenueStats | null>(null);

  useEffect(() => {
    apiClient.get<RevenueStats>("/api/payments/admin/revenue-stats")
      .then((d) => setStats(d))
      .catch(() => null);
  }, []);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <div className="border-b border-slate-100/70 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Doanh Thu VietQR SePay</h2>
          <p className="mt-0.5 text-sm text-slate-500">Thanh toán tự động qua SePay · VietinBank</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <DollarSign className="h-5 w-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 p-0">
        {/* Tổng doanh thu */}
        <div className="p-5 space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tổng Doanh Thu</p>
          <p className="text-2xl font-bold text-emerald-700">
            {stats ? fmt(stats.totalRevenue) : "—"}
          </p>
          <p className="text-xs text-slate-400">Tất cả thời gian</p>
        </div>

        {/* Hôm nay */}
        <div className="p-5 space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hôm Nay</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {stats ? fmt(stats.todayRevenue) : "—"}
          </p>
          <p className="text-xs text-slate-400">Doanh thu ngày hiện tại</p>
        </div>

        {/* Đơn hàng */}
        <div className="p-5 space-y-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Đơn Thành Công</p>
          </div>
          <p className="text-2xl font-bold text-violet-700">
            {stats ? stats.successOrdersCount.toLocaleString("vi-VN") : "—"}
          </p>
          <p className="text-xs text-slate-400">
            {stats ? `${stats.pendingOrdersCount} đơn đang chờ` : "Đang tải..."}
          </p>
        </div>
      </div>
    </div>
  );
}
