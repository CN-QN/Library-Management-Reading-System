'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2, Clock, BookOpen, ExternalLink, RefreshCw } from 'lucide-react';
import { getMyOrders, type PaymentQrData } from '@/lib/api/payment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function PaymentHistoryTab() {
  const [orders, setOrders] = useState<PaymentQrData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
    // Fetch once when the history tab mounts; subsequent refreshes are user-driven.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

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
      <Card className="border-dashed py-12 text-center">
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
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Lịch sử giao dịch VietQR SePay ({orders.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={fetchOrders} className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {orders.map((order) => {
          const isSuccess = order.status === 'SUCCESS';

          return (
            <Card key={order.orderCode} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${isSuccess ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                    {isSuccess ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                        #{order.orderCode}
                      </span>
                      <Badge variant={isSuccess ? 'default' : 'secondary'} className={isSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'}>
                        {isSuccess ? 'Đã mở khóa' : 'Chờ thanh toán'}
                      </Badge>
                    </div>

                    <h4 className="font-medium text-base text-foreground line-clamp-1">
                      {order.bookTitle}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Nội dung CK: <code className="font-mono text-primary font-bold">{order.paymentContent}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Số tiền</span>
                    <span className="text-base font-bold text-primary">
                      {order.amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>

                  {isSuccess ? (
                    <Link
                      href={`/books/reader/${order.bookId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />
                      Đọc ngay
                    </Link>
                  ) : (
                    <Link
                      href={`/books/detail/${order.bookId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-accent font-medium text-xs transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Xem chi tiết
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
