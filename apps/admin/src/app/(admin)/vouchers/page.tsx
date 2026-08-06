"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

interface VoucherItem {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxUsage: number;
  usedCount: number;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED";
}

export default function VouchersAdminPage() {
  const { showToast } = useToast();
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState(50);
  const [maxUsage, setMaxUsage] = useState(100);
  const [expiresAt, setExpiresAt] = useState("2026-12-31");

  async function fetchVouchers() {
    setIsLoading(true);
    try {
      const data = await apiClient.get<VoucherItem[]>("/api/vouchers");
      setVouchers(data || []);
    } catch {
      showToast("Không thể tải danh sách Voucher.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchVouchers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      showToast("Vui lòng nhập Mã Voucher!", "error");
      return;
    }

    try {
      await apiClient.post("/api/vouchers", {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: 10000,
        maxUsage: Number(maxUsage),
        expiresAt: new Date(expiresAt).toISOString(),
        status: "ACTIVE",
      });
      showToast("Tạo Voucher thành công!", "success");
      setIsModalOpen(false);
      setCode("");
      fetchVouchers();
    } catch {
      showToast("Lỗi khi tạo Voucher.", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa Voucher này khỏi cơ sở dữ liệu?")) return;
    try {
      await apiClient.delete(`/api/vouchers/${id}`);
      showToast("Xóa Voucher thành công!", "success");
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    } catch {
      showToast("Không thể xóa Voucher.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quản Lý Voucher & Mã Giảm Giá (Backend API Real)</h1>
          <p className="text-sm text-slate-500">
            Tạo và quản lý các mã giảm giá mua quyền đọc sách số 10.000 VNĐ lưu trong MongoDB.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Tạo Voucher Mới
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Đang tải Voucher từ MongoDB...</div>
        ) : vouchers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Chưa có Voucher nào trong MongoDB.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Mã Voucher</th>
                <th className="px-4 py-3">Mức giảm</th>
                <th className="px-4 py-3">Lượt đã dùng</th>
                <th className="px-4 py-3">Hạn sử dụng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{v.code}</td>
                  <td className="px-4 py-3.5 font-medium">
                    {v.discountType === "PERCENT" ? `Giảm ${v.discountValue}%` : `Giảm ${v.discountValue.toLocaleString("vi-VN")} VNĐ`}
                  </td>
                  <td className="px-4 py-3.5">{v.usedCount} / {v.maxUsage}</td>
                  <td className="px-4 py-3.5 font-mono text-xs">{new Date(v.expiresAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                      {v.status === "ACTIVE" ? "Đang chạy" : "Hết hạn"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="text-xs font-medium text-rose-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">Tạo Mã Voucher Mới</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Voucher (Viết hoa)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: LH50OFF"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại giảm</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giá trị</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lượt dùng tối đa</label>
                  <input
                    type="number"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Hủy</button>
                <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white">Lưu Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
