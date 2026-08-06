"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { paymentsApi, type PaymentOrder, type RevenueSummary } from "@/lib/api/payments";
import { DollarSign, CheckCircle2, Clock3, Search } from "lucide-react";

const PAGE_SIZE = 20;

function statusVariant(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "SUCCESS") return "success";
  if (status === "PENDING") return "warning";
  if (status === "FAILED") return "danger";
  return "neutral";
}

export default function TransactionsPage() {
  const [items, setItems] = useState<PaymentOrder[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([paymentsApi.orders(), paymentsApi.revenue()])
      .then(([o, r]) => { setItems(o); setSummary(r); })
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(
    () => items.filter((x) =>
      `${x.orderCode} ${x.bookTitle} ${x.userId}`.toLowerCase().includes(search.toLowerCase())
    ),
    [items, search]
  );

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Giao dịch thanh toán</h1>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Stat Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-emerald-700">
              {(summary?.totalRevenue ?? 0).toLocaleString("vi-VN")}₫
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Thành công</p>
            <p className="text-2xl font-bold text-blue-700">
              {summary?.successOrdersCount ?? 0}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Đang chờ</p>
            <p className="text-2xl font-bold text-amber-700">
              {summary?.pendingOrdersCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã đơn, sách, người dùng…"
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Sách</th>
              <th className="px-4 py-3 font-medium">Số tiền</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((x) => (
              <tr key={x.orderCode} className="bg-white hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3 font-mono text-blue-700 font-medium">{x.orderCode}</td>
                <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{x.bookTitle}</td>
                <td className="px-4 py-3 font-semibold text-emerald-700">{x.amount.toLocaleString("vi-VN")}₫</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(x.status)}>{x.status}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {x.paidAt
                    ? new Date(x.paidAt).toLocaleString("vi-VN")
                    : x.createdAt
                    ? new Date(x.createdAt).toLocaleString("vi-VN")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!paged.length && (
          <p className="p-8 text-center text-sm text-slate-400">Không có giao dịch phù hợp.</p>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-500">
            Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} giao dịch
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
