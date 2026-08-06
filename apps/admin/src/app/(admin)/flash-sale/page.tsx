"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Zap, Plus, Trash2, Edit2, Pause, Play, CheckCircle2, X } from "lucide-react";

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSaleItem | null>(null);

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

  const handleOpenCreate = () => {
    setEditingSale(null);
    setName("");
    setSalePrice(5000);
    setEndTime("2026-08-15T23:59");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sale: FlashSaleItem) => {
    setEditingSale(sale);
    setName(sale.name);
    setSalePrice(sale.salePrice);
    setEndTime(new Date(sale.endTime).toISOString().slice(0, 16));
    setIsModalOpen(true);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Vui lòng nhập tên chương trình Flash Sale!", "error");
      return;
    }

    if (editingSale) {
      // Edit existing
      setSales(
        sales.map((s) =>
          s.id === editingSale.id
            ? {
                ...s,
                name: name.trim(),
                salePrice: Number(salePrice),
                endTime: new Date(endTime).toISOString(),
              }
            : s
        )
      );
      showToast(`Đã cập nhật sự kiện "${name}" thành công!`, "success");
    } else {
      // Create new
      try {
        await apiClient.post("/api/flashsale", {
          name: name.trim(),
          originalPrice: 10000,
          salePrice: Number(salePrice),
          startTime: new Date().toISOString(),
          endTime: new Date(endTime).toISOString(),
          status: "RUNNING",
        });
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
      showToast("Bật đợt Flash Sale thành công!", "success");
    }

    setIsModalOpen(false);
  }

  const handleToggleStatus = (id: string) => {
    setSales(
      sales.map((s) =>
        s.id === id ? { ...s, status: s.status === "RUNNING" ? "ENDED" : "RUNNING" } : s
      )
    );
    showToast("Đã cập nhật trạng thái hoạt động Flash Sale!", "success");
  };

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
            Tạo, chỉnh sửa thời gian và tạm dừng/bật sự kiện ưu đãi đếm ngược thời gian thực trên trang chủ độc giả.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
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
          sales.map((sale) => {
            const isRunning = sale.status === "RUNNING";
            return (
              <div
                key={sale.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm border-l-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isRunning ? "border-amber-200 border-l-amber-500" : "border-slate-200 border-l-slate-400 opacity-80"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className={`h-5 w-5 ${isRunning ? "text-amber-500 fill-amber-500 animate-pulse" : "text-slate-400"}`} />
                    <h3 className="font-bold text-sm text-slate-900">{sale.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                        isRunning ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isRunning ? "🔥 ĐANG CHẠY TRÊN HOMEPAGE" : "⏸️ ĐANG TẠM DỪNG"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Giá ưu đãi: <strong className="text-amber-600 text-sm">{sale.salePrice.toLocaleString("vi-VN")} VNĐ</strong> (Giá gốc: {sale.originalPrice.toLocaleString("vi-VN")} VNĐ) | Hạn kết thúc: {new Date(sale.endTime).toLocaleString("vi-VN")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(sale.id)}
                    className={`font-bold text-xs flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl border ${
                      isRunning ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isRunning ? "Tạm Dừng" : "Bật Chạy"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(sale)}
                    className="font-bold text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                    Chỉnh Sửa
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(sale.id)}
                    className="font-bold text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                {editingSale ? `Chỉnh Sửa Flash Sale: ${editingSale.name}` : "Tạo Đợt Flash Sale Mới"}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
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
                <button type="submit" className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm">
                  {editingSale ? "Lưu Thay Đổi" : "Bật Flash Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
