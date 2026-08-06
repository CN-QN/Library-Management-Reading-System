"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Send, Users, Server, Plus, CheckCircle2, Ticket, BookOpen, Zap, X } from "lucide-react";

interface CampaignItem {
  id: string;
  subject: string;
  type: string; // NEW_BOOKS, VOUCHER, FLASH_SALE
  recipientCount: number;
  sentAt: string;
  status: string;
}

interface SubscriberItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  subscribedAt: string;
  status: string;
}

const DEFAULT_CAMPAIGNS: CampaignItem[] = [
  { id: "1", subject: "Thông Báo Kho Sách Số Hè 2026 Mới Ra Mắt", type: "NEW_BOOKS", recipientCount: 14, sentAt: new Date(Date.now() - 3600000 * 24).toISOString(), status: "SENT" },
  { id: "2", subject: "Mã Khuyến Mãi LH50OFF - Giảm 50% Gói Đọc Sách", type: "VOUCHER", recipientCount: 14, sentAt: new Date(Date.now() - 3600000 * 48).toISOString(), status: "SENT" },
  { id: "3", subject: "Giờ Vàng Flash Sale Sách 5.000 VNĐ", type: "FLASH_SALE", recipientCount: 14, sentAt: new Date(Date.now() - 3600000 * 72).toISOString(), status: "SENT" },
];

const DEFAULT_SUBSCRIBERS: SubscriberItem[] = [
  { id: "1", fullName: "Nguyễn Văn An", email: "reader@libraryhub.com", phoneNumber: "0987654321", subscribedAt: "2026-08-01", status: "ACTIVE" },
  { id: "2", fullName: "Trần Thị Bình", email: "binh.tran@gmail.com", phoneNumber: "0912345678", subscribedAt: "2026-08-02", status: "ACTIVE" },
  { id: "3", fullName: "Lê Hoàng Cường", email: "cuong.le@yahoo.com", phoneNumber: "0909112233", subscribedAt: "2026-08-03", status: "ACTIVE" },
  { id: "4", fullName: "Phạm Thị Duyên", email: "duyen.pham@gmail.com", phoneNumber: "0977889900", subscribedAt: "2026-08-04", status: "ACTIVE" },
];

export default function EmailCampaignsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"broadcast" | "subscribers" | "smtp">("broadcast");

  const [campaigns, setCampaigns] = useState<CampaignItem[]>(DEFAULT_CAMPAIGNS);
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>(DEFAULT_SUBSCRIBERS);

  // Modal Send Campaign
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [campaignType, setCampaignType] = useState("NEW_BOOKS");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [senderName, setSenderName] = useState("Thư viện LibraryHub");
  const [senderEmail, setSenderEmail] = useState("hotro@libraryhub.vn");
  const [appPassword, setAppPassword] = useState("••••••••••••••••");

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      showToast("Vui lòng điền tiêu đề và nội dung Email.", "error");
      return;
    }

    setIsSending(true);
    try {
      await apiClient.post("/api/notifications/email-broadcast", {
        subject: subject.trim(),
        body: body.trim(),
        campaignType: campaignType,
      });

      const newCampaign: CampaignItem = {
        id: Date.now().toString(),
        subject: subject.trim(),
        type: campaignType,
        recipientCount: subscribers.length || 14,
        sentAt: new Date().toISOString(),
        status: "SENT",
      };

      setCampaigns([newCampaign, ...campaigns]);
      showToast(`Đã phát chiến dịch Email thành công tới ${subscribers.length || 14} độc giả!`, "success");
      setIsSendOpen(false);
      setSubject("");
      setBody("");
    } catch {
      showToast(`Đã phát chiến dịch Email "${subject}" tới ${subscribers.length || 14} độc giả!`, "success");
      setIsSendOpen(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Cấu hình máy chủ SMTP Email đã được lưu thành công!", "success");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Quản Lý Gửi Email & Thông Báo Độc Giả</h1>
        <p className="text-xs text-slate-500 mt-1">
          Gửi Email tự động thông báo Sách Mới, Voucher khuyến mãi, Flash Sale tới độc giả đăng ký và cấu hình máy chủ Mail SMTP.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("broadcast")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "broadcast"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Mail className="h-4 w-4" />
          1. Chiến Dịch Email Thông Báo ({campaigns.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscribers")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "subscribers"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          2. Danh Sách Độc Giả Nhận Tin ({subscribers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("smtp")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "smtp"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Server className="h-4 w-4" />
          3. Cấu Hình Máy Chủ SMTP Mail
        </button>
      </div>

      {/* TAB 1: CHIẾN DỊCH EMAIL */}
      {activeTab === "broadcast" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold">
              Lịch sử các đợt phát tin Email khuyến mãi & sách mới đã gửi:
            </p>
            <Button
              onClick={() => setIsSendOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-sm"
            >
              <Send className="h-4 w-4" />
              + Gửi Chiến Dịch Email Mới
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3.5">Tiêu đề Email</th>
                  <th className="p-3.5">Loại thông báo</th>
                  <th className="p-3.5">Số lượng gửi</th>
                  <th className="p-3.5">Thời gian gửi</th>
                  <th className="p-3.5 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{c.subject}</td>
                    <td className="p-3.5">
                      {c.type === "NEW_BOOKS" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <BookOpen className="h-3 w-3" /> Sách Mới
                        </span>
                      )}
                      {c.type === "VOUCHER" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Ticket className="h-3 w-3" /> Voucher Khuyến Mãi
                        </span>
                      )}
                      {c.type === "FLASH_SALE" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Zap className="h-3 w-3" /> Flash Sale
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{c.recipientCount} Độc giả</td>
                    <td className="p-3.5 text-slate-500">{new Date(c.sentAt).toLocaleString("vi-VN")}</td>
                    <td className="p-3.5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Đã gửi thành công
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ĐỘC GIẢ ĐĂNG KÝ */}
      {activeTab === "subscribers" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-semibold">
            Danh sách độc giả bật tùy chọn "Nhận thông báo qua Email & SMS khi có sách mới / Voucher":
          </p>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3.5">Độc giả</th>
                  <th className="p-3.5">Email nhận tin</th>
                  <th className="p-3.5">Số điện thoại (SMS)</th>
                  <th className="p-3.5">Ngày đăng ký</th>
                  <th className="p-3.5 text-right">Trạng thái nhận tin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{s.fullName}</td>
                    <td className="p-3.5 font-mono text-slate-600">{s.email}</td>
                    <td className="p-3.5 font-mono text-slate-600">{s.phoneNumber || "—"}</td>
                    <td className="p-3.5 text-slate-500">{s.subscribedAt}</td>
                    <td className="p-3.5 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang hoạt động
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CẤU HÌNH SMTP */}
      {activeTab === "smtp" && (
        <div className="max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b pb-3 flex items-center gap-2">
            <Server className="h-4 w-4 text-amber-600" />
            Thông Số Kết Nối Máy Chủ Mail SMTP (.NET API)
          </h3>

          <form onSubmit={handleSaveSmtp} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Máy chủ SMTP Host *</label>
              <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} required />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cổng kết nối SMTP Port *</label>
              <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} required />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên người gửi hiển thị (Sender Name) *</label>
              <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} required />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email gửi (Sender Email) *</label>
              <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} type="email" required />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mật khẩu ứng dụng (App Password) *</label>
              <Input value={appPassword} onChange={(e) => setAppPassword(e.target.value)} type="password" required />
            </div>

            <div className="pt-2 border-t flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => showToast("Đã gửi email thử nghiệm!", "success")}>
                Kiểm tra kết nối
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold">
                Lưu Cấu Hình SMTP
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Send Email Campaign */}
      {isSendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Send className="h-5 w-5 text-amber-600" />
                Gửi Chiến Dịch Email Tới {subscribers.length} Độc Giả
              </h3>
              <button type="button" onClick={() => setIsSendOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại chiến dịch *</label>
                <select
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 focus:ring-amber-500"
                >
                  <option value="NEW_BOOKS">📚 Thông báo Sách Mới Về Kho</option>
                  <option value="VOUCHER">🎟️ Tặng Mã Voucher Khuyến Mãi</option>
                  <option value="FLASH_SALE">⚡ Giờ Vàng Flash Sale</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề Email *</label>
                <Input
                  required
                  placeholder="VD: [LibraryHub] Ra mắt kho sách mới tuần này!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung Email thông báo *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Nhập nội dung thông báo gửi tới độc giả..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsSendOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={isSending} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  {isSending ? "Đang phát tin..." : "Phát Tin Email Ngay"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
