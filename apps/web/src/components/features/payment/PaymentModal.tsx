'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Copy, Check, QrCode, ShieldCheck, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createPaymentQr, getOrderStatus, type PaymentQrData } from '@/lib/api/payment';
import { usePaymentSignalR } from '@/hooks/usePaymentSignalR';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  onPaymentSuccess: () => void;
}

interface BankInfo {
  bankName: string;
  bankAccount: string;
  accountName: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<PaymentQrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);

  // Khởi tạo mã VietQR + bank info khi modal mở
  useEffect(() => {
    if (isOpen && bookId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      setError(null);
      setIsSuccess(false);
      setTimeLeft(600);

      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5210';

      Promise.all([
        createPaymentQr(bookId),
        fetch(`${apiBase}/api/payments/bank-info`)
          .then((r) => r.json())
          .then((res) => (res?.data as BankInfo) ?? null)
          .catch(() => null),
      ])
        .then(([qr, bank]) => {
          setQrData(qr);
          if (bank) setBankInfo(bank);
        })
        .catch(() => {
          setError('Không thể tạo mã QR thanh toán. Vui lòng thử lại.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setQrData(null);
    }
  }, [isOpen, bookId]);

  // Đếm ngược 10 phút
  useEffect(() => {
    if (!isOpen || isSuccess || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSuccess, timeLeft]);

  // Xử lý khi thanh toán thành công (nhận từ Redis Pub/Sub hoặc Polling)
  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onPaymentSuccess();
      onClose();
    }, 2500);
  };

  // 1. Lắng nghe thông báo Real-time từ Redis Pub/Sub qua SignalR
  usePaymentSignalR({
    orderCode: qrData?.orderCode || null,
    onSuccess: () => handleSuccess(),
    enabled: isOpen && !isSuccess && !!qrData?.orderCode,
  });

  // 2. Polling 4s fallback trường hợp mạng bị vắt WebSocket
  useEffect(() => {
    if (!isOpen || isSuccess || !qrData?.orderCode) return;

    const interval = setInterval(async () => {
      try {
        const res = await getOrderStatus(qrData.orderCode);
        if (res.status === 'SUCCESS') {
          handleSuccess();
        }
      } catch {
        // Bỏ qua lỗi polling
      }
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSuccess, qrData?.orderCode]);

  const copyToClipboard = (text: string, type: 'content' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'content') {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const bankLabel = bankInfo
    ? `${bankInfo.bankName} – TK: ${bankInfo.bankAccount}`
    : 'VietinBank – STK: 105886719416';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl bg-white">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2 text-foreground">
            <QrCode className="w-5 h-5 text-primary" />
            Thanh toán VietQR SePay
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Quét mã QR để mở khóa trọn bộ quyền đọc sách Premium: <span className="font-semibold text-foreground">{bookTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Đang khởi tạo mã VietQR thanh toán...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : isSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">Thanh toán thành công!</h3>
              <p className="text-xs text-muted-foreground">
                Redis Pub/Sub đã xác thực chuyển khoản. Bạn có thể đọc cuốn sách này ngay bây giờ.
              </p>
            </div>
          </div>
        ) : qrData ? (
          <div className="space-y-5 py-2">
            {/* Khung VietQR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl relative">
              <div className="w-56 h-56 bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
                <img
                  src={qrData.qrCodeUrl}
                  alt="VietQR SePay"
                  className="w-full h-full object-contain rounded"
                />
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-500/10 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                <span>Mã QR hết hạn sau: {formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Chi tiết chuyển khoản */}
            <div className="space-y-2.5 text-xs bg-white p-3.5 rounded-xl ring-1 ring-slate-200">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-muted-foreground">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-foreground">{bankLabel}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-muted-foreground">Số tiền thanh toán:</span>
                <div className="flex items-center gap-1.5 font-bold text-primary text-sm">
                  <span>{qrData.amount.toLocaleString('vi-VN')} VNĐ</span>
                  <button
                    onClick={() => copyToClipboard(qrData.amount.toString(), 'amount')}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Sao chép số tiền"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground font-semibold text-primary">Nội dung chuyển khoản (bắt buộc):</span>
                <div className="flex items-center gap-1.5 font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded text-sm">
                  <span>{qrData.paymentContent}</span>
                  <button
                    onClick={() => copyToClipboard(qrData.paymentContent, 'content')}
                    className="p-1 hover:bg-muted rounded text-primary hover:text-primary cursor-pointer"
                    title="Sao chép nội dung"
                  >
                    {copiedContent ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Chú thích SePay Real-time */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-slate-50 p-2.5 rounded-lg ring-1 ring-slate-100">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              <span>Hệ thống sử dụng **SePay + Redis Pub/Sub** tự động xác nhận trong vài giây ngay khi bạn hoàn tất chuyển khoản.</span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
