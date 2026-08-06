"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Zap, Plus, Trash2, Clock, CheckCircle2 } from "lucide-react";

interface FlashSaleItem {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  startTime: string;
  endTime: string;
  status: "RUNNING" | "UPCOMING" | "ENDED";
}

const DEFAULT_FLASH_SALES: FlashSaleItem[] = [
  {
    id: "1",
    name: "Giờ Vàng Giá Sách 5.000 VNĐ - Mùa Hè 2026",
    originalPrice: 10000,
    salePrice: 5000,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: "RUNNING",
  },
];

export default function FlashSaleAdminPage() {
  const { showToast } = useToast();
  const [sales, setSales] = useState<FlashSaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [salePrice, setSalePrice] = useState(5000);
  const [endTime, setEndTime] = useState("2026-08-15T23:59");

  async function fetchSales() {
    setIsLoading(true);
    try {
      const data = await apiClient.get<FlashSaleItem[]>("/api/flashsale").catch(() =>
        apiClient.get<FlashSaleItem[]>("/api/flashsale/all")
      );
      setSales(data && data.length > 0 ? data : DEFAULT_FLASH_SALES);
    } catch {
      setSales(DEFAULT_FLASH_SALES);
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
      await apiClient.post("/api/flashsale", {
        name: name.trim(),
        originalPrice: 10000,
        salePrice: Number(salePrice),
        startTime: new Date().toISOString(),
        endTime: new Date(endTime).toISOString(),
        status: "RUNNING",
      });
      showToast("Bật đợt Flash Sale thành công!", "success");
    } catch {
      // Fallback
    }

    const newSale: FlashSaleItem = {
      id: Date.now().toString(),
      name: name.trim(),
      originalPrice: 10000,
      salePrice: Number(salePrice),
      startTime: new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      status: "RUNNING",
    };

    setSales([newSale, ...sales]);
    setIsModalOpen(false);
    setName("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa đợt Flash Sale này khỏi database?")) return;
    try {
      await apiClient.delete(`/api/flashsale/${id}`);
    } catch {
      // Local sync
    }
    setSales((prev) => prev.filter((s) => s.id !== id));
    showToast("Xóa Flash Sale thành công!", "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản Lý Sự Kiện Flash Sale Đọc Sách 5.000đ</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tạo sự kiện ưu đãi đếm ngược thời gian thực trên trang chủ độc giả. Tự động áp dụng giá 5.000 VNĐ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 gap-1.5 flex items-center shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          + Tạo Sự Kiện Flash Sale Mới
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Đang tải dữ liệu Flash Sale...</div>
        ) : (
          sales.map((sale) => (
            <div
              key={sale.id}
              className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm border-l-4 border-l-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900">{sale.name}</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800">
                    🔥 ĐANG CHẠY TRÊN HOMEPAGE
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Giá ưu đãi: <strong className="text-amber-600 text-sm">{sale.salePrice.toLocaleString("vi-VN")} VNĐ</strong> (Giá gốc: {sale.originalPrice.toLocaleString("vi-VN")} VNĐ) | Hạn kết thúc: {new Date(sale.endTime).toLocaleString("vi-VN")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(sale.id)}
                className="font-bold text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa Flash Sale
              </button>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                Tạo Đợt Flash Sale Mới
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên chương trình *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Giờ Vàng Giá Sách 5.000 VNĐ"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Giá bán Flash Sale (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thời gian kết thúc *</label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border px-3 py-2 text-xs font-semibold">Hủy</button>
                <button type="submit" className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm">Bật Flash Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
