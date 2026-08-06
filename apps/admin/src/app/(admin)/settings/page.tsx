"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CreditCard, Cloud, BookOpen, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Group 1: Email SMTP
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [senderName, setSenderName] = useState("Thư viện LibraryHub");
  const [senderEmail, setSenderEmail] = useState("hotro@libraryhub.vn");
  const [appPassword, setAppPassword] = useState("••••••••••••••••");

  // Group 2: SePay VietQR Payment
  const [bankAccount, setBankAccount] = useState("105886719416");
  const [bankName, setBankName] = useState("VietinBank");
  const [accountHolder, setAccountHolder] = useState("THU VIEN LIBRARYHUB");
  const [sepayApiKey, setSepayApiKey] = useState("SePayApiKeySecret2026");

  // Group 3: Cloudinary Storage
  const [cloudName, setCloudName] = useState("demo");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("987654321012345");
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("••••••••••••••••••••••••••••");

  // Group 4: Borrowing Policies
  const [maxBorrowLimit, setMaxBorrowLimit] = useState("5");
  const [defaultBorrowDays, setDefaultBorrowDays] = useState("14");
  const [finePerDay, setFinePerDay] = useState("5000");

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      showToast("Đã lưu toàn bộ cấu hình thông số hệ thống thành công!", "success");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cấu Hình Thông Số Hệ Thống</h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập chi tiết cấu hình Máy chủ Email, Ngân hàng SePay, Cloudinary và Quy định mượn trả thư viện.
          </p>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 shadow-sm cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Đang lưu cấu hình..." : "Lưu Toàn Bộ Cấu Hình"}
        </Button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* GROUP 1: EMAIL SMTP CONFIGURATION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">1. Cấu Hình Gửi Email Thông Báo & Mã OTP Reset Password</h2>
              <p className="text-xs text-slate-500">Thiết lập máy chủ Mail SMTP để tự động gửi mã khôi phục 6 chữ số và thông báo sách mới.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Máy chủ SMTP (SMTP Host) *</label>
              <Input
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                required
              />
              <span className="text-[10px] text-slate-400">Mặc định dùng smtp.gmail.com hoặc máy chủ mail công ty</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cổng kết nối (SMTP Port) *</label>
              <Input
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
                required
              />
              <span className="text-[10px] text-slate-400">Cổng SSL mã hóa tiêu chuẩn 587 hoặc 465</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên thương hiệu người gửi (Sender Name) *</label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Thư viện LibraryHub"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Địa chỉ Email người gửi *</label>
              <Input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="hotro@libraryhub.vn"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Mật khẩu ứng dụng Gmail (App Password) *</label>
              <Input
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="Chuỗi 16 ký tự mật khẩu ứng dụng Google"
                required
              />
            </div>
          </div>
        </div>

        {/* GROUP 2: SEPAY VIETQR PAYMENT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">2. Cấu Hình Ngân Hàng Thanh Toán VietQR SePay Tự Động</h2>
              <p className="text-xs text-slate-500">Tự động đối soát giao dịch chuyển khoản 10.000 VNĐ để mở khóa sách số độc quyền.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên Ngân hàng nhận tiền *</label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VietinBank"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Số tài khoản Ngân hàng *</label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="105886719416"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên chủ tài khoản *</label>
              <Input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="THU VIEN LIBRARYHUB"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã SePay API Key Secret *</label>
              <Input
                type="password"
                value={sepayApiKey}
                onChange={(e) => setSepayApiKey(e.target.value)}
                placeholder="Nhập mã SePay API Key..."
                required
              />
            </div>
          </div>
        </div>

        {/* GROUP 3: CLOUDINARY MEDIA STORAGE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">3. Cấu Hình Máy Chủ Lưu Trữ Ảnh Cloudinary Media</h2>
              <p className="text-xs text-slate-500">Lưu trữ ảnh bìa sách số, ảnh avatar độc giả và tài nguyên Banner quảng cáo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cloud Name *</label>
              <Input
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="demo"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cloudinary API Key *</label>
              <Input
                value={cloudinaryApiKey}
                onChange={(e) => setCloudinaryApiKey(e.target.value)}
                placeholder="API Key..."
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cloudinary API Secret *</label>
              <Input
                type="password"
                value={cloudinaryApiSecret}
                onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                placeholder="API Secret..."
                required
              />
            </div>
          </div>
        </div>

        {/* GROUP 4: BORROWING POLICIES */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">4. Quy Định Mượn Trả Sách & Phí Quá Hạn Thư Viện</h2>
              <p className="text-xs text-slate-500">Cấu hình giới hạn mượn sách giấy tại quầy thủ thư và mức tính phạt quá hạn.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Số sách mượn tối đa / Độc giả *</label>
              <Input
                type="number"
                value={maxBorrowLimit}
                onChange={(e) => setMaxBorrowLimit(e.target.value)}
                placeholder="5"
                required
              />
              <span className="text-[10px] text-slate-400">Số lượng ấn bản tối đa 1 lượt</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Số ngày mượn tiêu chuẩn *</label>
              <Input
                type="number"
                value={defaultBorrowDays}
                onChange={(e) => setDefaultBorrowDays(e.target.value)}
                placeholder="14"
                required
              />
              <span className="text-[10px] text-slate-400">Thời hạn mượn tính theo ngày</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phí phạt quá hạn (VNĐ / Ngày) *</label>
              <Input
                type="number"
                value={finePerDay}
                onChange={(e) => setFinePerDay(e.target.value)}
                placeholder="5000"
                required
              />
              <span className="text-[10px] text-slate-400">Số tiền phạt tính trên từng ngày trễ</span>
            </div>
          </div>
        </div>

        {/* Submit Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-2 shadow-md cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSaving ? "Đang lưu cấu hình..." : "Xác Nhận Lưu Toàn Bộ Thông Số"}
          </Button>
        </div>
      </form>
    </div>
  );
}
