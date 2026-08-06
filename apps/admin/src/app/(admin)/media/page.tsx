"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api-client";

interface MediaAsset {
  id: string;
  url: string;
  name: string;
  size: string;
  category: "COVERS" | "BANNERS" | "AVATARS" | "AUTHORS";
}

const CATEGORY_MAP: Record<string, string> = {
  ALL: "Tất cả media",
  COVERS: "Bìa Sách",
  BANNERS: "Banner Trang Chủ",
  AVATARS: "Avatar Độc Giả",
  AUTHORS: "Ảnh Tác Giả",
};

export default function MediaAdminPage() {
  const { showToast } = useToast();
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [assets, setAssets] = useState<MediaAsset[]>([
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800",
      name: "dac_nhan_tam_cover.jpg",
      size: "1.2 MB",
      category: "COVERS",
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800",
      name: "nha_gia_kim_cover.jpg",
      size: "850 KB",
      category: "COVERS",
    },
    {
      id: "3",
      url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800",
      name: "banner_library_2026.png",
      size: "3.4 MB",
      category: "BANNERS",
    },
  ]);

  async function processFilesUpload(files: FileList | File[]) {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ml_default");

        const res = await fetch("https://api.cloudinary.com/v1_1/demo/image/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        const newUrl = data.secure_url || URL.createObjectURL(file);

        const newAsset: MediaAsset = {
          id: Date.now().toString() + Math.random(),
          url: newUrl,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          category: activeCategory === "ALL" ? "COVERS" : (activeCategory as any),
        };

        setAssets((prev) => [newAsset, ...prev]);
        showToast(`Tải lên ảnh ${file.name} thành công!`, "success");
      } catch {
        showToast("Lỗi khi tải ảnh lên Cloudinary.", "error");
      }
    }
    setIsUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFilesUpload(e.dataTransfer.files);
    }
  }

  async function handleDelete(asset: MediaAsset) {
    if (!confirm(`Bạn có chắc muốn xóa ảnh "${asset.name}" khỏi Cloudinary?`)) return;
    try {
      await apiClient.post("/api/media/delete-cloudinary", { publicId: asset.url });
    } catch {}
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    showToast("Đã xóa ảnh thành công!", "success");
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url);
    showToast("Đã sao chép URL Cloudinary vào bộ nhớ tạm!", "success");
  }

  const filteredAssets = assets.filter(
    (a) => activeCategory === "ALL" || a.category === activeCategory
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Thư Viện Media Cloudinary Tập Trung</h1>
          <p className="text-sm text-slate-500">
            Quản lý tập trung tất cả hình ảnh, phân loại theo thể loại & Kéo thả (Drag & Drop).
          </p>
        </div>
        <label className="inline-flex cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          {isUploading ? "Đang tải lên..." : "+ Tải Ảnh Mới Lên Cloudinary"}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && processFilesUpload(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Object.entries(CATEGORY_MAP).map(([code, label]) => (
          <button
            key={code}
            type="button"
            onClick={() => setActiveCategory(code)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeCategory === code
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver ? "border-slate-900 bg-slate-100" : "border-slate-300 bg-slate-50"
        }`}
      >
        <p className="text-sm font-medium text-slate-700">Kéo và thả nhiều tệp ảnh vào đây để tải lên Cloudinary</p>
        <p className="text-xs text-slate-500 mt-1">Hỗ trợ PNG, JPG, WEBP. Ảnh sẽ được tự động phân loại.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm group">
            <div className="h-44 relative overflow-hidden bg-slate-100">
              <img src={asset.url} alt={asset.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-900 truncate">{asset.name}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{asset.size}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">{CATEGORY_MAP[asset.category]}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => copyToClipboard(asset.url)}
                  className="text-xs font-medium text-slate-700 hover:underline"
                >
                  Sao chép URL
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(asset)}
                  className="text-xs font-medium text-rose-600 hover:underline"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
