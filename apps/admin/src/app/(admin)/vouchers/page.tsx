"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit2, Power, Plus, Ticket, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { promotionsApi, type Voucher } from "@/lib/api/promotions";

interface VoucherForm {
  code: string;
  discountType: string;
  discountValue: string;
  minOrderValue: string;
  maxUsage: string;
  expiresAt: string;
  status: string;
}

const EMPTY_FORM: VoucherForm = { code: "", discountType: "PERCENT", discountValue: "10", minOrderValue: "0", maxUsage: "100", expiresAt: "", status: "ACTIVE" };
const PAGE_SIZE = 15;

const toLocalInput = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function VouchersPage() {
  const { showToast } = useToast();
  const [allItems, setAllItems] = useState<Voucher[]>([]);
  const [form, setForm] = useState<VoucherForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true); setError("");
    try { setAllItems(await promotionsApi.vouchers.list()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải voucher."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const items = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setIsModalOpen(true); }
  function openEdit(item: Voucher) {
    setEditing(item);
    setForm({ code: item.code, discountType: item.discountType, discountValue: String(item.discountValue), minOrderValue: String(item.minOrderValue), maxUsage: String(item.maxUsage), expiresAt: toLocalInput(item.expiresAt), status: item.status === "EXPIRED" ? "ACTIVE" : item.status });
    setIsModalOpen(true);
  }

  function payload(status = form.status) {
    return { code: form.code.trim().toUpperCase(), discountType: form.discountType, discountValue: Number(form.discountValue), minOrderValue: Number(form.minOrderValue), maxUsage: Number(form.maxUsage), expiresAt: new Date(form.expiresAt).toISOString(), status };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setIsSaving(true);
    try {
      const value = payload();
      if (editing) await promotionsApi.vouchers.update(editing.id, value);
      else {
        const { status: _status, ...createValue } = value;
        void _status;
        await promotionsApi.vouchers.create(createValue);
      }
      setIsModalOpen(false); await load(); showToast(editing ? "Đã cập nhật voucher." : "Đã tạo voucher.", "success");
    } catch (cause) { showToast(cause instanceof Error ? cause.message : "Không thể lưu voucher.", "error"); }
    finally { setIsSaving(false); }
  }

  async function toggle(item: Voucher) {
    try {
      await promotionsApi.vouchers.update(item.id, { code: item.code, discountType: item.discountType, discountValue: item.discountValue, minOrderValue: item.minOrderValue, maxUsage: item.maxUsage, expiresAt: item.expiresAt, status: item.status === "ACTIVE" ? "DISABLED" : "ACTIVE" });
      await load(); showToast(item.status === "ACTIVE" ? "Đã tắt voucher." : "Đã bật voucher.", "success");
    } catch (cause) { showToast(cause instanceof Error ? cause.message : "Không thể đổi trạng thái voucher.", "error"); }
  }

  async function remove(item: Voucher) {
    if (!confirm(`Xóa voucher "${item.code}"?`)) return;
    try { await promotionsApi.vouchers.remove(item.id); await load(); showToast("Đã xóa voucher.", "success"); }
    catch (cause) { showToast(cause instanceof Error ? cause.message : "Không thể xóa voucher.", "error"); }
  }

  const statusVariant = (status: string): "success" | "warning" | "neutral" => status === "ACTIVE" ? "success" : status === "DISABLED" ? "warning" : "neutral";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Quản lý Voucher</h1><p className="mt-1 text-sm text-slate-500">Quản lý loại giảm giá, điều kiện, hạn dùng và số lượt sử dụng.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />Thêm voucher</Button>
      </header>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Đang tải voucher…</p>
        ) : allItems.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500"><Ticket className="mx-auto mb-2 h-8 w-8" />Chưa có voucher.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Mức giảm</th>
                <th className="px-4 py-3">Điều kiện</th>
                <th className="px-4 py-3">Sử dụng</th>
                <th className="px-4 py-3">Hết hạn</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">{item.code}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{item.discountType === "PERCENT" ? `${item.discountValue}%` : `${item.discountValue.toLocaleString("vi-VN")}₫`}</td>
                  <td className="px-4 py-3">Từ {item.minOrderValue.toLocaleString("vi-VN")}₫</td>
                  <td className="px-4 py-3">{item.usedCount}/{item.maxUsage}</td>
                  <td className="px-4 py-3">{new Date(item.expiresAt).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant(item.status)}>{item.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={item.status === "EXPIRED"} onClick={() => void toggle(item)}><Power className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}><Edit2 className="h-4 w-4" />Sửa</Button>
                      <Button size="sm" variant="danger" onClick={() => void remove(item)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {allItems.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-500">
            Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, allItems.length)} / {allItems.length} voucher
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Chỉnh sửa voucher" : "Thêm voucher"} footer={<><Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button><Button form="voucher-form" type="submit" isLoading={isSaving}>Lưu</Button></>}>
        <form id="voucher-form" onSubmit={save} className="space-y-4">
          <Input label="Mã voucher *" required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
          <div className="grid grid-cols-2 gap-3"><Select label="Loại giảm" value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value }))}><option value="PERCENT">Phần trăm</option><option value="FIXED">Số tiền</option></Select><Input label="Giá trị *" type="number" min={1} required value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3"><Input label="Đơn tối thiểu" type="number" min={0} required value={form.minOrderValue} onChange={(event) => setForm((current) => ({ ...current, minOrderValue: event.target.value }))} /><Input label="Lượt tối đa *" type="number" min={1} required value={form.maxUsage} onChange={(event) => setForm((current) => ({ ...current, maxUsage: event.target.value }))} /></div>
          <Input label="Hết hạn *" type="datetime-local" required value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} />
          {editing && <Select label="Trạng thái" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="ACTIVE">Đang hoạt động</option><option value="DISABLED">Tạm tắt</option></Select>}
        </form>
      </Modal>
    </div>
  );
}
