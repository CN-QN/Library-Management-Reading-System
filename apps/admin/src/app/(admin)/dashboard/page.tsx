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
import { RevenueWidget } from "@/components/dashboard/revenue-widget";
import { BookOpen, Users, RefreshCcw, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const fetchStats = useCallback(() => reportsApi.getDashboardSummary(), []);
  const { data, error, isLoading, retry } = useAsync(fetchStats);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-slate-900">
          Chào mừng trở lại, {user?.fullName ?? "..."}
        </h1>
        <p className="text-sm text-slate-500">
          Vai trò hiện tại: <span className="font-medium text-slate-700">{user?.roles?.join(", ") || "—"}</span>
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
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Tổng số sách"
              stat={data.statCards.totalBooks}
              variant="blue"
              icon={<BookOpen className="h-4 w-4" />}
              trend={{ value: 1, label: "Thư viện đang hoạt động" }}
            />
            <StatCard
              label="Tổng số người dùng"
              stat={data.statCards.totalUsers}
              variant="violet"
              icon={<Users className="h-4 w-4" />}
              trend={{ value: 1, label: "Độc giả đã đăng ký" }}
            />
            <StatCard
              label="Đang mượn"
              stat={data.statCards.activeBorrowings}
              variant="emerald"
              icon={<RefreshCcw className="h-4 w-4" />}
              trend={{ value: 0, label: "Phiếu mượn đang mở" }}
            />
            <StatCard
              label="Quá hạn"
              stat={data.statCards.overdueBorrowings}
              variant="rose"
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={{ value: -1, label: "Cần xử lý khẩn" }}
            />
          </div>

          {/* Revenue Widget */}
          <RevenueWidget />

          {/* Borrowing Trend Chart */}
          <BorrowingTrendChart data={data.borrowingTrend} />

          {/* Books Widgets */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TrendingBooksWidget books={data.trendingBooks} />
            <RecentBooksWidget books={data.recentBooks} />
          </div>
        </>
      )}
    </div>
  );
}
