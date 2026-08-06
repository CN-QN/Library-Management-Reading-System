'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2, Clock, BookOpen, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMyOrders, type PaymentQrData } from '@/lib/api/payment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentDetailModal } from './PaymentDetailModal';
import { PaymentModal } from '@/components/features/payment/PaymentModal';

const ITEMS_PER_PAGE = 5;

export function PaymentHistoryTab() {
  const [orders, setOrders] = useState<PaymentQrData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<PaymentQrData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Active QR modal state
  const [payQrModal, setPayQrModal] = useState<{ isOpen: boolean; bookId: string; bookTitle: string }>({
    isOpen: false,
    bookId: '',
    bookTitle: '',
  });

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error('Lỗi tải lịch sử mua sách:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDetail = (order: PaymentQrData) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleOpenPaymentQr = (bookId: string, bookTitle: string) => {
    setPayQrModal({
      isOpen: true,
      bookId,
      bookTitle,
    });
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Đang tải lịch sử thanh toán SePay...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="border-dashed py-12 text-center bg-white shadow-sm ring-1 ring-slate-100">
        <CardContent className="flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
            <CreditCard className="h-8 w-8" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Chưa có giao dịch mua sách nào</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Bạn chưa thực hiện giao dịch mua quyền đọc sách Premium nào qua VietQR SePay.
          </p>
          <Link
            href="/books"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Khám phá kho sách số ngay
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2 text-slate-900">
          <CreditCard className="h-5 w-5 text-primary" />
          Lịch sử giao dịch VietQR SePay ({orders.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={fetchOrders} className="gap-1.5 text-xs text-slate-600">
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-3">
        {pagedOrders.map((order) => {
          const isSuccess = order.status === 'SUCCESS';

          return (
            <Card
              key={order.orderCode}
              className="hover:border-primary/40 transition-all bg-white shadow-sm ring-1 ring-slate-100 border-0"
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl mt-0.5 ${
                      isSuccess
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isSuccess ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        #{order.orderCode}
                      </span>
                      <Badge
                        variant={isSuccess ? 'default' : 'secondary'}
                        className={
                          isSuccess
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium'
                        }
                      >
                        {isSuccess ? 'Đã mở khóa' : 'Chờ thanh toán'}
                      </Badge>
                    </div>

                    <h4 className="font-medium text-base text-slate-900 line-clamp-1">
                      {order.bookTitle}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nội dung CK: <code className="font-mono text-primary font-bold">{order.paymentContent}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Số tiền</span>
                    <span className="text-base font-bold text-primary">
                      {order.amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(order)}
                      className="gap-1.5 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      Xem chi tiết
                    </Button>

                    {isSuccess && (
                      <Link
                        href={`/books/reader/${order.bookId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors"
                      >
                        <BookOpen className="h-4 w-4" />
                        Đọc ngay
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1">
          <p className="text-xs text-slate-500">
            Hiển thị <span className="font-semibold text-slate-700">{startIndex + 1}</span>–
            <span className="font-semibold text-slate-700">
              {Math.min(startIndex + ITEMS_PER_PAGE, orders.length)}
            </span>{' '}
            trong tổng số <span className="font-semibold text-slate-700">{orders.length}</span> giao dịch
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Trước
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`h-8 w-8 rounded-md text-xs font-semibold transition-colors ${
                  pageNum === currentPage
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              Sau
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <PaymentDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onOpenPaymentQrModal={handleOpenPaymentQr}
      />

      {/* Active VietQR Payment Modal */}
      {payQrModal.isOpen && (
        <PaymentModal
          isOpen={payQrModal.isOpen}
          onClose={() => setPayQrModal({ isOpen: false, bookId: '', bookTitle: '' })}
          bookId={payQrModal.bookId}
          bookTitle={payQrModal.bookTitle}
          onPaymentSuccess={() => {
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
