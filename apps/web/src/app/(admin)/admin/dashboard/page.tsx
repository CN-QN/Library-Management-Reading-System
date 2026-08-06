'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign, CheckCircle2, Clock, AlertTriangle, TrendingUp, BookOpen, Users, RefreshCw, BarChart2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RevenueStats {
  totalRevenue: number;
  todayRevenue: number;
  totalSuccessOrders: number;
  todaySuccessOrders: number;
  successRate: number;
}

interface OrderItem {
  orderCode: number;
  amount: number;
  bookTitle: string;
  paymentContent: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeRange, setActiveRange] = useState<'7' | '30'>('7');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        apiClient.get('/payments/admin/revenue-stats'),
        apiClient.get('/payments/admin/all-orders'),
      ]);

      setStats(statsRes.data?.data || null);
      setRecentOrders(ordersRes.data?.data || []);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu Dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mock data cho Biểu đồ Doanh Thu & Mượn Sách 7 - 30 ngày gần nhất
  const chartPoints7 = [
    { day: 'T2', revenue: 40000, loans: 12 },
    { day: 'T3', revenue: 70000, loans: 18 },
    { day: 'T4', revenue: 30000, loans: 9 },
    { day: 'T5', revenue: 90000, loans: 24 },
    { day: 'T6', revenue: 120000, loans: 31 },
    { day: 'T7', revenue: 150000, loans: 42 },
    { day: 'CN', revenue: 180000, loans: 48 },
  ];

  const chartPoints30 = [
    { day: 'Tuần 1', revenue: 450000, loans: 110 },
    { day: 'Tuần 2', revenue: 720000, loans: 165 },
    { day: 'Tuần 3', revenue: 890000, loans: 210 },
    { day: 'Tuần 4', revenue: 1250000, loans: 290 },
  ];

  const activePoints = activeRange === '7' ? chartPoints7 : chartPoints30;
  const maxRev = Math.max(...activePoints.map((p) => p.revenue));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tổng Quan Hệ Thống & Doanh Thu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thống kê doanh thu bán sách 10.000 VNĐ qua VietQR SePay, biểu đồ xu hướng và danh sách giao dịch mới nhất.
          </p>
        </div>

        <Button onClick={fetchData} variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tổng Doanh Thu SePay</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {(stats?.totalRevenue || 0).toLocaleString('vi-VN')} VNĐ
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Từ các đơn hàng thanh toán 10.000 VNĐ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Doanh Thu Hôm Nay</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {(stats?.todayRevenue || 0).toLocaleString('vi-VN')} VNĐ
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.todaySuccessOrders || 0} đơn mở khóa thành công
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tổng Đơn Thành Công</CardTitle>
            <BookOpen className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.totalSuccessOrders || 0} đơn
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tỷ lệ hoàn tất: <span className="font-bold text-emerald-600">{stats?.successRate || 100}%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Độc Giả Hoạt Động</CardTitle>
            <Users className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,248</div>
            <p className="text-xs text-muted-foreground mt-1">Đã đăng ký tài khoản cộng đồng</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area / Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Biểu Đồ Xu Hướng Doanh Thu & Lượt Đọc Sách
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Thống kê số dư nhận qua SePay VietQR và lượt đọc sách theo thời gian
              </CardDescription>
            </div>

            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={activeRange === '7' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveRange('7')}
                className="text-xs h-7 px-2.5"
              >
                7 Ngày
              </Button>
              <Button
                variant={activeRange === '30' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveRange('30')}
                className="text-xs h-7 px-2.5"
              >
                30 Ngày
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="h-64 w-full flex items-end justify-between gap-3 px-2 pt-6 pb-2 border-b border-border">
              {activePoints.map((pt, idx) => {
                const heightPercent = Math.max(15, Math.round((pt.revenue / maxRev) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full max-w-[40px] bg-primary/20 hover:bg-primary/40 rounded-t-md transition-all relative flex flex-col justify-end overflow-hidden" style={{ height: `${heightPercent}%` }}>
                      <div className="w-full bg-primary rounded-t-md transition-all" style={{ height: '70%' }} />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold py-1 px-2 rounded shadow border border-border whitespace-nowrap z-10">
                        {pt.revenue.toLocaleString('vi-VN')} VNĐ ({pt.loans} lượt)
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{pt.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-primary" />
                Doanh thu SePay (VNĐ)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-primary/30" />
                Lượt đọc sách E-Book
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Book Type Distribution Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tỷ Lệ Loại Sách</CardTitle>
            <CardDescription className="text-xs">Phân bổ sách FREE và PAID trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative h-44 w-44 rounded-full border-8 border-primary/20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent border-l-transparent transform -rotate-45" />
              <div className="text-center">
                <span className="text-3xl font-black text-foreground block">85%</span>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Sách PAID (10k)</span>
              </div>
            </div>

            <div className="w-full space-y-2 mt-6">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  Sách Trả phí (10.000 VNĐ)
                </span>
                <span className="font-bold">42 cuốn (84%)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/30" />
                  Sách Miễn phí (FREE)
                </span>
                <span className="font-bold">8 cuốn (16%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-semibold">Giao Dịch VietQR SePay Gần Đây</CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Đang tải lịch sử giao dịch...</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Chưa có giao dịch SePay nào.</div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Mã Đơn Hàng</th>
                  <th className="px-4 py-3">Tên Sách</th>
                  <th className="px-4 py-3">Số Tiền</th>
                  <th className="px-4 py-3">Nội Dung CK</th>
                  <th className="px-4 py-3 text-center">Trạng Thái</th>
                  <th className="px-4 py-3 text-right">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.slice(0, 10).map((order) => {
                  const isSuccess = order.status === 'SUCCESS';
                  return (
                    <tr key={order.orderCode} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-primary">#{order.orderCode}</td>
                      <td className="px-4 py-3.5 font-medium">{order.bookTitle}</td>
                      <td className="px-4 py-3.5 font-bold text-foreground">
                        {order.amount.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{order.paymentContent}</td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={isSuccess ? 'default' : 'secondary'} className={isSuccess ? 'bg-emerald-600' : ''}>
                          {isSuccess ? 'Thành công' : 'Chờ thanh toán'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
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
