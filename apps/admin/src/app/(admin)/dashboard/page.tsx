"use client";

import { useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useAsync } from "@/hooks/use-async";
import { reportsApi } from "@/lib/api/reports";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { StatCardsSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendingBooksWidget } from "@/components/dashboard/trending-books-widget";
import { RecentBooksWidget } from "@/components/dashboard/recent-books-widget";
import { BorrowingTrendChart } from "@/components/dashboard/borrowing-trend-chart";

export default function DashboardPage() {
  const { user } = useAuth();

  const fetchStats = useCallback(() => reportsApi.getDashboardSummary(), []);
  const { data, error, isLoading, retry } = useAsync(fetchStats);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Chào mừng trở lại, {user?.fullName ?? "..."}
        </h1>
        <p className="text-sm text-slate-500">
          Vai trò hiện tại: {user?.roles.join(", ") || "—"}
        </p>
      </div>

      {isLoading && <StatCardsSkeleton count={4} />}

      {!isLoading && error && (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải thống kê tổng quan."
          }
          onRetry={retry}
        />
      )}

      {!isLoading && !error && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Tổng số sách" stat={data.statCards.totalBooks} />
            <StatCard label="Tổng số người dùng" stat={data.statCards.totalUsers} />
            <StatCard label="Đang mượn" stat={data.statCards.activeBorrowings} />
            <StatCard label="Quá hạn" stat={data.statCards.overdueBorrowings} />
          </div>

          <div>
            <BorrowingTrendChart data={data.borrowingTrend} />
            <p className="mt-1 text-xs text-slate-400">
              Tính từ 100 phiếu mượn gần nhất (chưa có API thống kê theo thời gian ở backend).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TrendingBooksWidget books={data.trendingBooks} />
            <RecentBooksWidget books={data.recentBooks} />
          </div>
        </>
      )}
    </div>
  );
}
