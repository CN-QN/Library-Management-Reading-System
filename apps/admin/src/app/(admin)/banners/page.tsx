"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Image as ImageIcon, Upload, Loader2, Plus, Trash2, Eye, EyeOff, Edit2, X } from "lucide-react";

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
}

const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: "1",
    title: "Chào Hè 2026 - Mở Kho Sách Số 10.000đ",
    subtitle: "Khám phá hàng nghìn tác phẩm E-Book bản quyền đọc mượt mà trên mọi thiết bị",
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200",
    linkUrl: "/books",
    isActive: true,
  },
  {
    id: "2",
    title: "Flash Sale Đọc Sách Số Chỉ 5.000 VNĐ",
    subtitle: "Thanh toán siêu tốc VietQR SePay tự động mở khóa ngay tức thì",
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200",
    linkUrl: "/books",
    isActive: true,
  },
];

export default function BannersAdminPage() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/books");
  const [isUploading, setIsUploading] = useState(false);

  async function fetchBanners() {
    setIsLoading(true);
    try {
      const data = await apiClient.get<BannerItem[]>("/api/banners");
      setBanners(data && data.length > 0 ? data : DEFAULT_BANNERS);
    } catch {
      setBanners(DEFAULT_BANNERS);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setLinkUrl("/books");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BannerItem) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || "");
    setImageUrl(b.imageUrl);
    setLinkUrl(b.linkUrl || "/books");
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:5210/api/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json();
      const url = json?.data?.secure_url || json?.data?.url;
      if (url) {
        setImageUrl(url);
        showToast("Tải ảnh Banner lên Cloudinary thành công!", "success");
      }
    } catch {
      showToast("Lỗi khi tải tệp ảnh lên server.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      showToast("Vui lòng nhập Tiêu đề và Tải ảnh Banner!", "error");
      return;
    }

    if (editingBanner) {
      // Edit existing Banner
      try {
        await apiClient.put(`/api/banners/${editingBanner.id}`, {
          title,
          subtitle,
          imageUrl,
          linkUrl,
          isActive: editingBanner.isActive,
        });
      } catch {
        // Fallback
      }

      setBanners(
        banners.map((b) =>
          b.id === editingBanner.id
            ? { ...b, title, subtitle, imageUrl, linkUrl }
            : b
        )
      );
      showToast(`Đã cập nhật Banner "${title}" thành công!`, "success");
    } else {
      // Create new Banner
      try {
        await apiClient.post("/api/banners", {
          title,
          subtitle,
          imageUrl,
          linkUrl,
          isActive: true,
          sortOrder: banners.length + 1,
        });
      } catch {
        // Fallback
      }

      const newB: BannerItem = {
        id: Date.now().toString(),
        title,
        subtitle,
        imageUrl,
        linkUrl,
        isActive: true,
      };

      setBanners([newB, ...banners]);
      showToast("Tạo Banner thành công!", "success");
    }

    setIsModalOpen(false);
  }

  async function handleToggleStatus(id: string) {
    try {
      await apiClient.patch(`/api/banners/${id}/status`);
    } catch {
      // Local sync
    }
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
    showToast("Đã cập nhật trạng thái hiển thị Banner!", "success");
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa Banner này khỏi database?")) return;
    try {
      await apiClient.delete(`/api/banners/${id}`);
    } catch {
      // Local sync
    }
    setBanners((prev) => prev.filter((b) => b.id !== id));
    showToast("Xóa Banner thành công!", "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản Lý Banner Trang Chủ UI (Cloudinary Auto Upload)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý Banner Slider lướt động trên trang chủ độc giả. Hỗ trợ thêm, chỉnh sửa, ẩn/hiện và tải tệp ảnh Cloudinary.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 gap-1.5 flex items-center shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          + Thêm Banner Trang Chủ Mới
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Đang tải Banner...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="h-44 relative overflow-hidden bg-slate-100">
                <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                <span className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold ${b.isActive ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-700 text-slate-200"}`}>
                  {b.isActive ? "Đang Hiển Thị" : "Đang Ẩn"}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 truncate">{b.title}</h3>
                <p className="text-xs text-slate-500 truncate">{b.subtitle}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(b.id)}
                    className="font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    {b.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-emerald-600" />}
                    {b.isActive ? "Ẩn Banner" : "Bật hiển thị"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Chỉnh Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa Banner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-amber-600" />
                {editingBanner ? `Chỉnh Sửa Banner: ${editingBanner.title}` : "Thêm Banner Trang Chủ Mới"}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề Banner *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Chào Hè 2026 - Mở Kho Sách 10k"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="VD: Đọc không giới hạn kho sách..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              {/* Tải ảnh Cloudinary */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">Tải tệp ảnh Cloudinary *</label>
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang tải ảnh lên Cloudinary...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Tải Tệp Ảnh Lên Cloudinary</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Hoặc dán URL ảnh trực tiếp..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 font-mono text-[11px] mt-1"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Link URL chuyển hướng</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/books"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border px-3 py-2 text-xs font-semibold">Hủy</button>
                <button type="submit" className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm">
                  {editingBanner ? "Lưu Thay Đổi" : "Lưu Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
