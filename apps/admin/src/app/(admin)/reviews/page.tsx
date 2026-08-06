"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, EyeOff, ShieldX, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { reviewsApi, type AdminReview } from "@/lib/api/reviews";

export default function ReviewsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminReview[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true); setError("");
    try {
      const result = await reviewsApi.list(status, page);
      setItems(result.items); setTotalItems(result.totalItems); setTotalPages(Math.max(1, result.totalPages));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải đánh giá."); }
    finally { setIsLoading(false); }
  }, [page, status]);

  useEffect(() => {
    // Synchronize the selected moderation page with the persisted admin API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function moderate(item: AdminReview, nextStatus: string) {
    setBusyId(item.id);
    try { await reviewsApi.moderate(item.id, nextStatus); await load(); showToast("Đã cập nhật trạng thái đánh giá.", "success"); }
    catch (cause) { showToast(cause instanceof Error ? cause.message : "Không thể kiểm duyệt đánh giá.", "error"); }
    finally { setBusyId(""); }
  }

  async function remove(item: AdminReview) {
    if (!confirm(`Xóa vĩnh viễn đánh giá của ${item.userFullName}?`)) return;
    setBusyId(item.id);
    try { await reviewsApi.remove(item.id); await load(); showToast("Đã xóa đánh giá.", "success"); }
    catch (cause) { showToast(cause instanceof Error ? cause.message : "Không thể xóa đánh giá.", "error"); }
    finally { setBusyId(""); }
  }

  const badgeVariant = (value: string): "success" | "warning" | "danger" | "neutral" => value === "APPROVED" ? "success" : value === "REJECTED" ? "danger" : value === "HIDDEN" ? "warning" : "neutral";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Kiểm duyệt đánh giá</h1><p className="mt-1 text-sm text-slate-500">Duyệt, ẩn, từ chối hoặc xóa nhận xét của độc giả.</p></div>
        <div className="w-full sm:w-52"><Select label="Lọc trạng thái" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Tất cả</option><option value="APPROVED">Đã duyệt</option><option value="HIDDEN">Đang ẩn</option><option value="REJECTED">Đã từ chối</option></Select></div>
      </header>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {isLoading ? <p className="p-8 text-center text-sm text-slate-500">Đang tải đánh giá…</p> : items.length === 0 ? <p className="p-10 text-center text-sm text-slate-500"><Star className="mx-auto mb-2 h-8 w-8" />Không có đánh giá phù hợp.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Độc giả</th><th className="px-4 py-3">Số sao</th><th className="px-4 py-3">Nội dung</th><th className="px-4 py-3">Ngày gửi</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Kiểm duyệt</th></tr></thead>
            <tbody className="divide-y">{items.map((item) => <tr key={item.id} className="align-top hover:bg-slate-50"><td className="px-4 py-4"><p className="font-semibold text-slate-900">{item.userFullName}</p><p className="text-xs text-slate-500">{item.userEmail}</p><p className="mt-1 max-w-36 truncate text-xs text-slate-400" title={item.bookId}>Sách: {item.bookId}</p></td><td className="whitespace-nowrap px-4 py-4 font-semibold text-amber-500">{"★".repeat(item.rating)}<span className="text-slate-300">{"★".repeat(5 - item.rating)}</span></td><td className="max-w-md px-4 py-4 text-slate-700">{item.comment}</td><td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("vi-VN")}</td><td className="px-4 py-4"><Badge variant={badgeVariant(item.status)}>{item.status}</Badge></td><td className="px-4 py-4"><div className="flex min-w-52 justify-end gap-2"><Button size="sm" variant="outline" disabled={busyId === item.id || item.status === "APPROVED"} onClick={() => void moderate(item, "APPROVED")} title="Duyệt"><Check className="h-4 w-4 text-emerald-600" /></Button><Button size="sm" variant="outline" disabled={busyId === item.id || item.status === "HIDDEN"} onClick={() => void moderate(item, "HIDDEN")} title="Ẩn"><EyeOff className="h-4 w-4 text-amber-600" /></Button><Button size="sm" variant="outline" disabled={busyId === item.id || item.status === "REJECTED"} onClick={() => void moderate(item, "REJECTED")} title="Từ chối"><ShieldX className="h-4 w-4 text-red-600" /></Button><Button size="sm" variant="danger" disabled={busyId === item.id} onClick={() => void remove(item)} title="Xóa"><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}</tbody>
          </table>
        )}
      </div>
      <div className="flex flex-col items-center gap-2"><p className="text-xs text-slate-500">Tổng cộng {totalItems} đánh giá</p><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
    </div>
  );
}
