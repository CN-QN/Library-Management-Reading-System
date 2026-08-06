'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, CheckCircle2, Clock, RefreshCw, TrendingUp, CreditCard } from 'lucide-react';
import { getRevenueStats, getAllOrders, type RevenueStatsData, type PaymentQrData } from '@/lib/api/payment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<RevenueStatsData>({
    totalRevenue: 0,
    todayRevenue: 0,
    successOrdersCount: 0,
    pendingOrdersCount: 0,
    totalOrdersCount: 0,
  });

  const [recentOrders, setRecentOrders] = useState<PaymentQrData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, ordersData] = await Promise.all([
        getRevenueStats(),
        getAllOrders(),
      ]);
      if (statsData) setStats(statsData);
      if (ordersData) setRecentOrders(ordersData);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const successRate = stats.totalOrdersCount > 0
    ? Math.round((stats.successOrdersCount / stats.totalOrdersCount) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tổng Quan & Doanh Thu SePay</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Báo cáo thống kê tài chính bán quyền đọc sách số 10.000 VNĐ từ cổng SePay VietQR.
          </p>
        </div>

        <Button onClick={fetchData} variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Cập nhật số liệu
        </Button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Tổng doanh thu
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats.totalRevenue.toLocaleString('vi-VN')} VNĐ
              </h3>
              <span className="text-xs text-muted-foreground mt-1 block">Tích lũy từ đơn SePay</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider">
                Doanh thu Hôm nay
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats.todayRevenue.toLocaleString('vi-VN')} VNĐ
              </h3>
              <span className="text-xs text-muted-foreground mt-1 block">Trong 24 giờ qua</span>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Đơn đã thanh toán
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats.successOrdersCount} <span className="text-xs font-normal text-muted-foreground">/ {stats.totalOrdersCount} đơn</span>
              </h3>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                Tỷ lệ thành công {successRate}%
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Đơn chờ thanh toán
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {stats.pendingOrdersCount} <span className="text-xs font-normal text-muted-foreground">đơn</span>
              </h3>
              <span className="text-xs text-muted-foreground mt-1 block">Đang quét mã QR</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Giao Dịch VietQR SePay Mới Nhất ({recentOrders.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Chưa có giao dịch thanh toán nào được ghi nhận.
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Mã đơn hàng</th>
                  <th className="px-4 py-3">Tên sách</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Nội dung CK</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => {
                  const isSuccess = order.status === 'SUCCESS';

                  return (
                    <tr key={order.orderCode} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-primary">
                        #{order.orderCode}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground max-w-xs truncate">
                        {order.bookTitle}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {order.amount.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {order.paymentContent}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant={isSuccess ? 'default' : 'secondary'}
                          className={isSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'}
                        >
                          {isSuccess ? 'Thành công' : 'Chờ quét QR'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
