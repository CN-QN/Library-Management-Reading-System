"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { promotionsApi, type FlashSale } from "@/lib/api/promotions";

interface FlashSaleForm {
  name: string;
  originalPrice: string;
  salePrice: string;
  startTime: string;
  endTime: string;
}

const EMPTY_FORM: FlashSaleForm = { name: "", originalPrice: "10000", salePrice: "5000", startTime: "", endTime: "" };
const toLocalInput = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function FlashSalesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<FlashSale[]>([]);
  const [form, setForm] = useState<FlashSaleForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<FlashSale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try { setItems(await promotionsApi.flashSales.list()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải flash sale."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    // Synchronize the page with the persisted admin API on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEdit(item: FlashSale) {
    setEditing(item);
    setForm({ name: item.name, originalPrice: String(item.originalPrice), salePrice: String(item.salePrice), startTime: toLocalInput(item.startTime), endTime: toLocalInput(item.endTime) });
    setIsModalOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      originalPrice: Number(form.originalPrice),
      salePrice: Number(form.salePrice),
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
    };
    if (payload.salePrice >= payload.originalPrice) {
      showToast("Giá sale phải nhỏ hơn giá gốc.", "error");
      return;
    }
    setIsSaving(true);
    try {
      if (editing) await promotionsApi.flashSales.update(editing.id, payload);
      else await promotionsApi.flashSales.create(payload);
      setIsModalOpen(false);
      await load();
      showToast(editing ? "Đã cập nhật flash sale." : "Đã tạo flash sale.", "success");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Không thể lưu flash sale.", "error");
    } finally { setIsSaving(false); }
  }

  async function remove(item: FlashSale) {
    if (!confirm(`Xóa flash sale “${item.name}”?`)) return;
    try { await promotionsApi.flashSales.remove(item.id); await load(); showToast("Đã xóa flash sale.", "success"); }
    catch (cause) { showToast(cause instanceof Error ? cause.message : "Không thể xóa flash sale.", "error"); }
  }

  const statusVariant = (status: string): "success" | "warning" | "neutral" => status === "RUNNING" ? "success" : status === "UPCOMING" ? "warning" : "neutral";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Quản lý Flash Sale</h1><p className="mt-1 text-sm text-slate-500">Tạo và chỉnh sửa khung giờ, giá gốc và giá khuyến mãi.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />Thêm flash sale</Button>
      </header>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {isLoading ? <p className="p-8 text-center text-sm text-slate-500">Đang tải flash sale…</p> : items.length === 0 ? <p className="p-10 text-center text-sm text-slate-500"><Zap className="mx-auto mb-2 h-8 w-8" />Chưa có flash sale.</p> : (
          <div className="divide-y">
            {items.map((item) => <article key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2"><h2 className="font-semibold text-slate-900">{item.name}</h2><Badge variant={statusVariant(item.status)}>{item.status}</Badge></div>
                <p className="text-sm"><span className="font-semibold text-red-600">{item.salePrice.toLocaleString("vi-VN")}₫</span><span className="ml-2 text-slate-400 line-through">{item.originalPrice.toLocaleString("vi-VN")}₫</span></p>
                <p className="text-xs text-slate-500">{new Date(item.startTime).toLocaleString("vi-VN")} → {new Date(item.endTime).toLocaleString("vi-VN")}</p>
              </div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEdit(item)}><Edit2 className="h-4 w-4" />Sửa</Button><Button size="sm" variant="danger" onClick={() => void remove(item)}><Trash2 className="h-4 w-4" />Xóa</Button></div>
            </article>)}
          </div>
        )}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Chỉnh sửa flash sale" : "Thêm flash sale"} footer={<><Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button><Button form="flash-sale-form" type="submit" isLoading={isSaving}>Lưu</Button></>}>
        <form id="flash-sale-form" onSubmit={save} className="space-y-4">
          <Input label="Tên sự kiện *" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Input label="Giá gốc *" type="number" min={1} required value={form.originalPrice} onChange={(event) => setForm({ ...form, originalPrice: event.target.value })} /><Input label="Giá sale *" type="number" min={0} required value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} /></div>
          <Input label="Bắt đầu *" type="datetime-local" required value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
          <Input label="Kết thúc *" type="datetime-local" required value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} />
        </form>
      </Modal>
    </div>
  );
}
