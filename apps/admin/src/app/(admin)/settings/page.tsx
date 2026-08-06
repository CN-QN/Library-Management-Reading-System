"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { settingsApi, type AdminSetting } from "@/lib/api/settings";

const groups = ["EMAIL", "SEPAY", "CLOUDINARY", "BORROWING_POLICY"];
export default function SettingsPage() {
  const { showToast } = useToast(); const [items, setItems] = useState<AdminSetting[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { settingsApi.list().then(setItems).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  const change = (key: string, value: string) => setItems(v => v.map(x => x.key === key ? { ...x, value } : x));
  async function save() { setSaving(true); setError(""); try { const next = await settingsApi.save(items.map(x => ({ key: x.key, value: x.value, scope: x.scope, description: x.description ?? undefined }))); setItems(next); showToast("Đã lưu cấu hình hệ thống.", "success"); } catch (e) { const message = e instanceof Error ? e.message : "Không thể lưu cấu hình."; setError(message); showToast(message, "error"); } finally { setSaving(false); } }
  if (loading) return <p className="text-sm text-slate-500">Đang tải cấu hình…</p>;
  return <div className="space-y-6 max-w-5xl"><div className="flex justify-between"><div><h1 className="text-xl font-bold">Cấu hình hệ thống</h1><p className="text-xs text-slate-500">Dữ liệu được đọc và lưu trực tiếp trên máy chủ.</p></div><Button onClick={save} disabled={saving}>{saving ? "Đang lưu…" : "Lưu cấu hình"}</Button></div>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{groups.map(group => <section key={group} className="rounded-xl border bg-white p-5"><h2 className="mb-4 font-bold">{group}</h2><div className="grid gap-4 md:grid-cols-2">{items.filter(x => x.scope === group).map(item => <label key={item.key} className="text-xs font-semibold">{item.key}<Input className="mt-1" type={item.isConfigured && !item.value ? "password" : "text"} value={item.value} placeholder={item.isConfigured ? "Đã cấu hình — để trống để giữ nguyên" : "Chưa cấu hình"} onChange={e => change(item.key, e.target.value)} /><span className="text-[10px] text-slate-400">{item.description}</span></label>)}</div>{items.every(x => x.scope !== group) && <p className="text-sm text-slate-400">Chưa có cấu hình trong nhóm này.</p>}</section>)}</div>;
}
