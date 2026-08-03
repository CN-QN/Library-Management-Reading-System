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

function formatVnd(amount: number) {
  return amount.toLocaleString("vi-VN") + " đ";
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
      <CardHeader title="Tiền phạt" description="Tổng theo trạng thái (tối đa 100 bản ghi/trạng thái)" />
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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Báo cáo & Thống kê</h1>
        <p className="text-sm text-slate-500">
          Tổng hợp trực tiếp từ dữ liệu Sách / Người dùng / Mượn-trả / Tiền phạt hiện có.
        </p>
      </div>

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
