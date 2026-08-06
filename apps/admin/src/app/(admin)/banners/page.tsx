"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
}

export default function BannersAdminPage() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/books");

  async function fetchBanners() {
    setIsLoading(true);
    try {
      const data = await apiClient.get<BannerItem[]>("/api/banners");
      setBanners(data || []);
    } catch {
      showToast("Không thể tải Banner.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      showToast("Vui lòng nhập Tiêu đề và URL ảnh!", "error");
      return;
    }

    try {
      await apiClient.post("/api/banners", {
        title,
        subtitle,
        imageUrl,
        linkUrl,
        isActive: true,
        sortOrder: banners.length + 1,
      });
      showToast("Tạo Banner thành công!", "success");
      setIsModalOpen(false);
      setTitle("");
      setSubtitle("");
      setImageUrl("");
      fetchBanners();
    } catch {
      showToast("Lỗi khi lưu Banner.", "error");
    }
  }

  async function handleToggleStatus(id: string) {
    try {
      await apiClient.patch(`/api/banners/${id}/status`);
      showToast("Đã đổi trạng thái hiển thị!", "success");
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch {
      showToast("Lỗi khi đổi trạng thái.", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa Banner này khỏi database?")) return;
    try {
      await apiClient.delete(`/api/banners/${id}`);
      showToast("Xóa Banner thành công!", "success");
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch {
      showToast("Không thể xóa Banner.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quản Lý Banner Trang Chủ UI (Backend API Real)</h1>
          <p className="text-sm text-slate-500">
            Quản lý Banner Slider lướt động trên giao diện độc giả.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Thêm Banner Mới
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-slate-500">Đang tải Banner từ MongoDB...</div>
      ) : banners.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">Chưa có Banner nào trong database.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="h-44 relative overflow-hidden bg-slate-100">
                <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                  {b.isActive ? "Hiển thị" : "Đang ẩn"}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-base text-slate-900 truncate">{b.title}</h3>
                <p className="text-xs text-slate-500 truncate">{b.subtitle}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(b.id)}
                    className="text-xs font-medium text-slate-700 hover:underline"
                  >
                    {b.isActive ? "Ẩn Banner" : "Bật hiển thị"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">Thêm Banner Trang Chủ Mới</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề Banner *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Chào Hè 2026 - Mở Kho Sách 10k"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="VD: Đọc không giới hạn kho sách..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Ảnh Cloudinary *</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link URL</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/books"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Hủy</button>
                <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white">Lưu Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
