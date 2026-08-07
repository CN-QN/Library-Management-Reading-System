"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Eye, EyeOff, ImageIcon, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { mediaApi, type MediaAsset } from "@/lib/api/media";
import { promotionsApi, type Banner } from "@/lib/api/promotions";

interface BannerForm {
  title: string;
  subtitle: string;
  mediaId: string;
  linkUrl: string;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_FORM: BannerForm = {
  title: "",
  subtitle: "",
  mediaId: "",
  linkUrl: "/books",
  isActive: true,
  sortOrder: 0,
};

export default function BannersPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Banner[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [banners, assets] = await Promise.all([
        promotionsApi.banners.list(),
        mediaApi.list(),
      ]);
      setItems(banners);
      setMedia(assets.items.filter((asset) => asset.usageType === "banner"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải danh sách banner.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Synchronize the page with the persisted admin API on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const selectedMedia = useMemo(
    () => media.find((asset) => asset.id === form.mediaId),
    [form.mediaId, media]
  );

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: items.length });
    setIsModalOpen(true);
  }

  function openEdit(item: Banner) {
    setEditing(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle ?? "",
      mediaId: item.mediaId ?? "",
      linkUrl: item.linkUrl || "/books",
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setIsModalOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form.mediaId) {
      showToast("Vui lòng chọn ảnh từ thư viện Media.", "error");
      return;
    }
    setIsSaving(true);
    try {
      if (editing) await promotionsApi.banners.update(editing.id, form);
      else await promotionsApi.banners.create(form);
      setIsModalOpen(false);
      await load();
      showToast(editing ? "Đã cập nhật banner." : "Đã tạo banner.", "success");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Không thể lưu banner.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadBanner(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const asset = await mediaApi.upload(file, "banner", "promotions");
      setMedia((current) => current.some((item) => item.id === asset.id) ? current : [...current, asset]);
      setForm((current) => ({ ...current, mediaId: asset.id }));
      showToast("Đã tải ảnh banner.", "success");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Không thể tải ảnh banner.", "error");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function toggle(item: Banner) {
    if (!item.mediaId) {
      showToast("Banner cũ chưa liên kết Media; hãy chỉnh sửa và chọn ảnh trước.", "error");
      return;
    }
    try {
      await promotionsApi.banners.update(item.id, {
        title: item.title,
        subtitle: item.subtitle,
        mediaId: item.mediaId,
        linkUrl: item.linkUrl,
        isActive: !item.isActive,
        sortOrder: item.sortOrder,
      });
      await load();
      showToast(item.isActive ? "Đã ẩn banner." : "Đã bật banner.", "success");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Không thể đổi trạng thái.", "error");
    }
  }

  async function remove(item: Banner) {
    if (!confirm(`Xóa banner "${item.title}"?`)) return;
    try {
      await promotionsApi.banners.remove(item.id);
      await load();
      showToast("Đã xóa banner.", "success");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Không thể xóa banner.", "error");
    }
  }

  // FIX: Stable onClose ref. Truoc day `onClose={() => setIsModalOpen(false)}` tao arrow function moi moi render
  // => Modal useEffect([isOpen, onClose]) re-trigger => dialogRef.current?.focus() => input mat focus.
  // Sau: handleClose la stable ref (useCallback), useEffect khong re-trigger khi form state thay doi.
  const handleClose = useCallback(() => setIsModalOpen(false), []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Banner trang chủ</h1>
          <p className="mt-1 text-sm text-slate-500">Thêm, chỉnh sửa, sắp xếp và ẩn/hiện banner từ Media đã lưu.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />Thêm banner</Button>
      </header>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {isLoading ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Đang tải banner…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm">
          <ImageIcon className="mx-auto mb-2 h-8 w-8" />Chưa có banner.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="relative h-48 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute right-3 top-3"><Badge variant={item.isActive ? "success" : "neutral"}>{item.isActive ? "Đang hiển thị" : "Đang ẩn"}</Badge></div>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h2 className="font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.subtitle || "Không có mô tả"}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.linkUrl} · thứ tự {item.sortOrder}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                  <Button size="sm" variant="outline" onClick={() => void toggle(item)}>{item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{item.isActive ? "Ẩn" : "Hiện"}</Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(item)}><Edit2 className="h-4 w-4" />Sửa</Button>
                  <Button size="sm" variant="danger" onClick={() => void remove(item)}><Trash2 className="h-4 w-4" />Xóa</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editing ? "Chỉnh sửa banner" : "Thêm banner"}
        footer={<><Button variant="outline" onClick={handleClose}>Hủy</Button><Button form="banner-form" type="submit" isLoading={isSaving}>Lưu banner</Button></>}
      >
        <form id="banner-form" onSubmit={(e) => void save(e)} className="space-y-4">
          <Input label="Tiêu đề *" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          <Input label="Mô tả" value={form.subtitle} onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ảnh banner *</label>
            <label className="block cursor-pointer rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-600 hover:border-slate-500 hover:bg-slate-50">
              {isUploading ? "Đang tải ảnh lên Cloudinary…" : selectedMedia ? "Đổi ảnh khác từ máy" : "Chọn ảnh từ máy để tải lên Cloudinary"}
              <input className="hidden" type="file" accept="image/*" disabled={isUploading || isSaving} onChange={(e) => void uploadBanner(e)} />
            </label>
          </div>
          {selectedMedia && (
            <div className="overflow-hidden rounded-lg bg-slate-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedMedia.fileUrl} alt="Xem trước banner" className="h-32 w-full rounded object-cover" />
            </div>
          )}
          <Input label="Đường dẫn" required value={form.linkUrl} onChange={(event) => setForm((current) => ({ ...current, linkUrl: event.target.value }))} />
          <Input label="Thứ tự" type="number" min={0} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />Hiển thị banner ngay</label>
        </form>
      </Modal>
    </div>
  );
}
