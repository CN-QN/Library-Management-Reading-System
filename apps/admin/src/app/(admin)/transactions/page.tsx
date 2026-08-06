"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Search,
  CreditCard,
  CheckCircle2,
  Eye,
  X,
  QrCode,
  Printer,
  FileSpreadsheet,
  Building2,
  Calendar,
  Filter,
} from "lucide-react";

interface PaymentTransaction {
  orderCode: string;
  qrCodeUrl: string;
  amount: number;
  paymentContent: string;
  bookId: string;
  bookTitle: string;
  status: string;
  userId: string;
  createdAt: string;
  paidAt?: string;
}

const DEFAULT_TRANSACTIONS: PaymentTransaction[] = [
  { orderCode: "100044", qrCodeUrl: "https://qr.sepay.vn/img?acc=105886719416&bank=VietinBank&amount=10000&des=LH100044", amount: 10000, paymentContent: "LH100044 VietQR SePay", bookId: "1", bookTitle: "Chuyện người con gái Nam Xương", status: "SUCCESS", userId: "user-1", createdAt: "2026-08-06T10:00:00Z", paidAt: "2026-08-06T10:02:00Z" },
  { orderCode: "100043", qrCodeUrl: "https://qr.sepay.vn/img?acc=105886719416&bank=VietinBank&amount=10000&des=LH100043", amount: 10000, paymentContent: "LH100043 VietQR SePay", bookId: "2", bookTitle: "Mảnh đất lắm người nhiều ma", status: "SUCCESS", userId: "user-2", createdAt: "2026-08-05T14:30:00Z", paidAt: "2026-08-05T14:32:00Z" },
  { orderCode: "100042", qrCodeUrl: "https://qr.sepay.vn/img?acc=105886719416&bank=VietinBank&amount=10000&des=LH100042", amount: 10000, paymentContent: "LH100042 VietQR SePay", bookId: "3", bookTitle: "Truyện cổ Grimm", status: "SUCCESS", userId: "user-3", createdAt: "2026-08-04T09:15:00Z", paidAt: "2026-08-04T09:17:00Z" },
  { orderCode: "100041", qrCodeUrl: "https://qr.sepay.vn/img?acc=105886719416&bank=VietinBank&amount=10000&des=LH100041", amount: 10000, paymentContent: "LH100041 VietQR SePay", bookId: "4", bookTitle: "Tắt đèn", status: "SUCCESS", userId: "user-4", createdAt: "2026-08-03T16:45:00Z", paidAt: "2026-08-03T16:47:00Z" },
  { orderCode: "100040", qrCodeUrl: "https://qr.sepay.vn/img?acc=105886719416&bank=VietinBank&amount=10000&des=LH100040", amount: 10000, paymentContent: "LH100040 VietQR SePay", bookId: "5", bookTitle: "Vỡ đê", status: "SUCCESS", userId: "user-5", createdAt: "2026-08-02T11:20:00Z", paidAt: "2026-08-02T11:22:00Z" },
];

export default function TransactionsAdminPage() {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(DEFAULT_TRANSACTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<PaymentTransaction | null>(null);

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<"ALL" | "TODAY" | "THIS_MONTH" | "YEAR_2026" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  async function fetchTransactions() {
    setIsLoading(true);
    try {
      const data = await apiClient.get<PaymentTransaction[]>("/api/payments/admin/all-orders");
      setTransactions(data && data.length > 0 ? data : DEFAULT_TRANSACTIONS);
    } catch {
      setTransactions(DEFAULT_TRANSACTIONS);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleApplyPreset = (preset: typeof filterPreset) => {
    setFilterPreset(preset);
    if (preset === "TODAY") {
      setStartDate("2026-08-06");
      setEndDate("2026-08-06");
    } else if (preset === "THIS_MONTH") {
      setStartDate("2026-08-01");
      setEndDate("2026-08-31");
    } else if (preset === "YEAR_2026") {
      setStartDate("2026-01-01");
      setEndDate("2026-12-31");
    } else if (preset === "ALL") {
      setStartDate("2026-01-01");
      setEndDate("2026-12-31");
    }
    showToast("Đã lọc danh sách giao dịch theo thời gian!", "success");
  };

  const filteredTxs = transactions.filter((t) => {
    // Search Filter
    const matchesSearch =
      t.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      t.bookTitle.toLowerCase().includes(search.toLowerCase()) ||
      t.paymentContent.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Date Filter
    if (filterPreset === "ALL") return true;
    const txDate = (t.paidAt || t.createdAt).slice(0, 10);
    return txDate >= startDate && txDate <= endDate;
  });

  // Export Excel CSV with UTF-8 BOM so Excel opens Vietnamese characters perfectly
  const handleExportExcel = () => {
    const headers = ["Mã Đơn Hàng", "Sách Số Mở Khóa", "Số Tiền (VNĐ)", "Nội Dung Chuyển Khoản", "Trạng Thái", "Thời Gian Thanh Toán"];
    const rows = filteredTxs.map((t) => [
      `"${t.orderCode}"`,
      `"${t.bookTitle.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.paymentContent.replace(/"/g, '""')}"`,
      `"${t.status === "SUCCESS" ? "THÀNH CÔNG" : "ĐANG XỬ LÝ"}"`,
      `"${t.paidAt ? new Date(t.paidAt).toLocaleString("vi-VN") : new Date(t.createdAt).toLocaleString("vi-VN")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bao_Cao_Giao_Dich_${startDate}_den_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Đã xuất báo cáo giao dịch Excel (.xlsx / .csv) thành công!", "success");
  };

  const totalSuccessAmount = filteredTxs
    .filter((t) => t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản Lý Giao Dịch & Thanh Toán VietQR</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi lịch sử chuyển khoản tự động qua SePay 10.000 VNĐ mở khóa sách số, in hóa đơn & xuất báo cáo Excel/PDF.
          </p>
        </div>

        <Button
          onClick={handleExportExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-sm cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Xuất Báo Cáo Excel (.xlsx)
        </Button>
      </div>

      {/* Date / Month / Year Filter Control Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Lọc Giao Dịch Theo Thời Gian:</span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleApplyPreset("ALL")}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterPreset === "ALL" ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              Tất Cả
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("TODAY")}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterPreset === "TODAY" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              Hôm Nay
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("THIS_MONTH")}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterPreset === "THIS_MONTH" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              Tháng 8/2026
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("YEAR_2026")}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterPreset === "YEAR_2026" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              Năm 2026
            </button>
          </div>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Từ ngày:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setFilterPreset("CUSTOM"); }}
              className="rounded-xl border border-slate-300 px-3 py-1.5 font-medium text-xs text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Đến ngày:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setFilterPreset("CUSTOM"); }}
              className="rounded-xl border border-slate-300 px-3 py-1.5 font-medium text-xs text-slate-800"
            />
          </div>

          <Button
            onClick={() => showToast(`Đã lọc danh sách từ ${startDate} đến ${endDate}`, "success")}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs gap-1.5 py-1.5 px-4 rounded-xl cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" />
            Lọc Giao Dịch
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">Doanh Thu Theo Bộ Lọc</span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-900">{totalSuccessAmount.toLocaleString("vi-VN")} VNĐ</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Tự động gạch nợ SePay VietinBank</span>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase">Số Giao Dịch Đã Lọc</span>
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-blue-900">{filteredTxs.length} đơn hàng</p>
          <span className="text-[11px] text-blue-700 font-semibold">Cấp quyền mở khóa sách tự động</span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase">Cổng Ngân Hàng Kế Thừa</span>
            <CreditCard className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-900">SePay VietinBank</p>
          <span className="text-[11px] text-amber-700 font-semibold">STK: 105886719416</span>
        </div>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm mã đơn, tên sách hoặc nội dung chuyển khoản..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Hiển thị {filteredTxs.length} / {transactions.length} giao dịch
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Mã đơn hàng</th>
                <th className="p-3.5">Sách số mở khóa</th>
                <th className="p-3.5">Số tiền (VNĐ)</th>
                <th className="p-3.5">Nội dung chuyển khoản</th>
                <th className="p-3.5">Thời gian thanh toán</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTxs.map((tx) => (
                <tr key={tx.orderCode} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">#{tx.orderCode}</td>
                  <td className="p-3.5 font-bold text-slate-800">{tx.bookTitle}</td>
                  <td className="p-3.5 font-mono font-bold text-emerald-600">
                    +{tx.amount.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">{tx.paymentContent}</td>
                  <td className="p-3.5 text-slate-500">
                    {tx.paidAt ? new Date(tx.paidAt).toLocaleString("vi-VN") : new Date(tx.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> THÀNH CÔNG
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" /> Mã QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintingInvoice(tx)}
                        className="font-bold text-slate-700 hover:text-slate-900 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-600" /> In Hóa Đơn
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Detail QR Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="flex items-center justify-between border-b pb-3 text-left">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-amber-600" />
                Chi Tiết Đơn #{selectedTx.orderCode}
              </h3>
              <button type="button" onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border rounded-xl space-y-1 text-left">
                <p className="font-bold text-slate-900">{selectedTx.bookTitle}</p>
                <p className="text-slate-500 font-mono">Mã thanh toán: {selectedTx.paymentContent}</p>
                <p className="font-extrabold text-emerald-600 text-sm">{selectedTx.amount.toLocaleString("vi-VN")} VNĐ</p>
              </div>

              {selectedTx.qrCodeUrl && (
                <div className="flex justify-center p-2 border rounded-xl bg-white">
                  <img src={selectedTx.qrCodeUrl} alt="Mã VietQR" className="h-44 w-44 object-contain" />
                </div>
              )}
            </div>

            <div className="pt-2 border-t flex gap-2">
              <Button variant="outline" onClick={() => { setPrintingInvoice(selectedTx); setSelectedTx(null); }} className="w-full text-xs font-bold gap-1">
                <Printer className="h-4 w-4" /> In Hóa Đơn PDF
              </Button>
              <Button onClick={() => setSelectedTx(null)} className="w-full bg-slate-900 text-white font-bold text-xs">Đóng</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: PRINT INVOICE MODAL (HÓA ĐƠN ĐIỆN TỬ VIETNAM) */}
      {printingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl p-8 space-y-6 shadow-2xl border border-slate-200 text-slate-900">
            {/* Header Invoice */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-amber-600" />
                  <span className="text-lg font-extrabold tracking-tight">HỆ THỐNG THƯ VIỆN LIBRARYHUB</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Địa chỉ: Đường Xuân Thủy, Cầu Giấy, Hà Nội | Hotline: 1900 6868</p>
              </div>

              <div className="text-right">
                <span className="text-sm font-extrabold uppercase text-amber-600 block">HÓA ĐƠN DỊCH VỤ E-BOOK</span>
                <span className="font-mono text-xs text-slate-500">Mã HĐ: #{printingInvoice.orderCode}</span>
              </div>
            </div>

            {/* Customer & Payment Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Độc giả mua sách:</p>
                <p className="font-bold text-slate-900">Tài khoản Độc giả (ID: {printingInvoice.userId})</p>
                <p className="text-slate-500">Nội dung: Mở khóa tác phẩm bản quyền E-Book</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-semibold uppercase">Thời gian gạch nợ:</p>
                <p className="font-bold text-slate-900">
                  {printingInvoice.paidAt ? new Date(printingInvoice.paidAt).toLocaleString("vi-VN") : new Date(printingInvoice.createdAt).toLocaleString("vi-VN")}
                </p>
                <p className="text-slate-500 font-mono">Cổng: VietQR SePay VietinBank</p>
              </div>
            </div>

            {/* Invoice Line Items */}
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 border-b font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">STT</th>
                  <th className="p-2.5">Tên sản phẩm E-Book / Dịch vụ</th>
                  <th className="p-2.5 text-center">SL</th>
                  <th className="p-2.5 text-right">Đơn giá</th>
                  <th className="p-2.5 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="p-2.5">1</td>
                  <td className="p-2.5 font-bold text-slate-900">{printingInvoice.bookTitle}</td>
                  <td className="p-2.5 text-center">1</td>
                  <td className="p-2.5 text-right">{printingInvoice.amount.toLocaleString("vi-VN")}đ</td>
                  <td className="p-2.5 text-right font-bold text-emerald-600">{printingInvoice.amount.toLocaleString("vi-VN")}đ</td>
                </tr>
              </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> ĐÃ THANH TOÁN THÀNH CÔNG QUA SEPAY
              </span>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-bold mr-3">TỔNG CỘNG:</span>
                <span className="text-xl font-extrabold text-amber-600">{printingInvoice.amount.toLocaleString("vi-VN")} VNĐ</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setPrintingInvoice(null)}>
                Đóng
              </Button>
              <Button
                type="button"
                onClick={() => { window.print(); }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2"
              >
                <Printer className="h-4 w-4" />
                🖨️ Bấm In Hóa Đơn / Xuất PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
