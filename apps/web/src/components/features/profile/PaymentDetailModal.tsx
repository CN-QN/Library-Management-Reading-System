'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  BookOpen,
  QrCode,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PaymentQrData } from '@/lib/api/payment';

interface PaymentDetailModalProps {
  order: PaymentQrData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPaymentQrModal?: (bookId: string, bookTitle: string) => void;
}

export function PaymentDetailModal({
  order,
  isOpen,
  onClose,
  onOpenPaymentQrModal,
}: PaymentDetailModalProps) {
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  if (!order) return null;

  const isSuccess = order.status === 'SUCCESS';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl bg-white text-slate-900 shadow-xl">
        <DialogHeader className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              #{order.orderCode}
            </span>
            <Badge
              variant={isSuccess ? 'default' : 'secondary'}
              className={
                isSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
              }
            >
              {isSuccess ? 'Đã mở khóa' : 'Chờ thanh toán'}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 pt-1">
            Chi tiết đơn hàng thanh toán
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Thông tin giao dịch quyền đọc sách số VietQR SePay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Thông tin tác phẩm */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Tác phẩm</span>
            <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{order.bookTitle}</h4>
          </div>

          {/* Chi tiết chuyển khoản */}
          <div className="space-y-2 text-xs bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
              <span className="font-bold text-slate-900">VietinBank – STK: 105886719416</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Số tiền thanh toán:</span>
              <div className="flex items-center gap-1.5 font-bold text-primary text-sm">
                <span>{order.amount.toLocaleString('vi-VN')} VNĐ</span>
                <button
                  onClick={() => copyToClipboard(order.amount.toString(), 'amount')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                  title="Sao chép số tiền"
                >
                  {copiedAmount ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Nội dung CK (bắt buộc):</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 bg-primary/10 px-2 py-0.5 rounded">
                <span className="font-mono text-primary">{order.paymentContent}</span>
                <button
                  onClick={() => copyToClipboard(order.paymentContent, 'content')}
                  className="p-1 hover:bg-primary/20 rounded text-primary transition-colors"
                  title="Sao chép nội dung"
                >
                  {copiedContent ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Trạng thái giao dịch:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  isSuccess ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã ghi nhận thanh toán
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" /> Chờ ngân hàng xác nhận
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Phần hiển thị tùy thuộc vào trạng thái */}
          {isSuccess ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bạn đã hoàn tất thanh toán và có quyền truy cập đọc trọn bộ cuốn sách này.</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs" onClick={onClose}>
                  Đóng
                </Button>
                <Link
                  href={`/books/reader/${order.bookId}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                  onClick={onClose}
                >
                  <BookOpen className="w-4 h-4" />
                  Đọc ngay
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Ảnh VietQR Code nếu có */}
              {order.qrCodeUrl && (
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-44 h-44 bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
                    <img
                      src={order.qrCodeUrl}
                      alt="VietQR SePay"
                      className="w-full h-full object-contain rounded"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 font-medium">
                    Quét mã QR để hoàn tất chuyển khoản tự động
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs" onClick={onClose}>
                  Đóng
                </Button>
                {onOpenPaymentQrModal ? (
                  <Button
                    className="flex-1 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => {
                      onClose();
                      onOpenPaymentQrModal(order.bookId, order.bookTitle);
                    }}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Mở QR thanh toán
                  </Button>
                ) : (
                  <Link
                    href={`/books/detail/${order.bookId}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-colors"
                    onClick={onClose}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Đến trang sách
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
