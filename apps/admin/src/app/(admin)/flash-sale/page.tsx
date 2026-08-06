"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

interface FlashSaleItem {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  startTime: string;
  endTime: string;
  status: "RUNNING" | "UPCOMING" | "ENDED";
}

export default function FlashSaleAdminPage() {
  const { showToast } = useToast();
  const [sales, setSales] = useState<FlashSaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [salePrice, setSalePrice] = useState(5000);
  const [endTime, setEndTime] = useState("2026-08-07T23:59");

  async function fetchSales() {
    setIsLoading(true);
    try {
      const data = await apiClient.get<FlashSaleItem[]>("/api/flash-sale/all");
      setSales(data || []);
    } catch {
      showToast("Không thể tải sự kiện Flash Sale.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSales();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Vui lòng nhập tên chương trình Flash Sale!", "error");
      return;
    }

    try {
      await apiClient.post("/api/flash-sale", {
        name,
        originalPrice: 10000,
        salePrice: Number(salePrice),
        startTime: new Date().toISOString(),
        endTime,
        status: "RUNNING",
      });
      showToast("Tạo sự kiện Flash Sale thành công!", "success");
      setIsModalOpen(false);
      setName("");
      fetchSales();
    } catch {
      showToast("Lỗi khi lưu Flash Sale.", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa đợt Flash Sale này khỏi database?")) return;
    try {
      await apiClient.delete(`/api/flash-sale/${id}`);
      showToast("Xóa Flash Sale thành công!", "success");
      setSales((prev) => prev.filter((s) => s.id !== id));
    } catch {
      showToast("Không thể xóa Flash Sale.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quản Lý Sự Kiện Flash Sale 5.000đ (Backend API Real)</h1>
          <p className="text-sm text-slate-500">
            Tạo sự kiện ưu đãi đếm ngược thời gian thực trên trang chủ độc giả.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          + Tạo Flash Sale Mới
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Đang tải Flash Sale từ MongoDB...</div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Chưa có sự kiện Flash Sale nào.</div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm border-l-4 border-l-amber-500 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">{sale.name}</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">🔥 Đang chạy</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Giá ưu đãi: <strong className="text-amber-600">{sale.salePrice.toLocaleString("vi-VN")} VNĐ</strong> (Gốc: 10.000 VNĐ) | Kết thúc: {new Date(sale.endTime).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(sale.id)}
                className="text-xs font-medium text-rose-600 hover:underline"
              >
                Xóa
              </button>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">Tạo Đợt Flash Sale Mới</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên chương trình *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Giờ Vàng Giá Sách 5.000 VNĐ"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giá bán Flash Sale (VNĐ) *</label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian kết thúc *</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Hủy</button>
                <button type="submit" className="rounded-md bg-amber-600 px-4 py-1.5 text-sm font-medium text-white">Bật Flash Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
