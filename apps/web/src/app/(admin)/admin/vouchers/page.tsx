'use client';

import React, { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2, Copy, Check, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface VoucherItem {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxUsage: number;
  usedCount: number;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED';
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState(50);
  const [maxUsage, setMaxUsage] = useState(100);
  const [expiresAt, setExpiresAt] = useState('2026-12-31');

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/vouchers');
      const data = res.data?.data || [];
      setVouchers(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách Voucher:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      alert('Vui lòng nhập Mã Voucher!');
      return;
    }

    try {
      await apiClient.post('/vouchers', {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: 10000,
        maxUsage: Number(maxUsage),
        expiresAt: new Date(expiresAt).toISOString(),
        status: 'ACTIVE',
      });
      setIsModalOpen(false);
      setCode('');
      fetchVouchers();
    } catch (err) {
      alert('Không thể tạo Voucher. Mã có thể đã tồn tại.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa mã voucher này khỏi hệ thống database?')) {
      try {
        await apiClient.delete(`/vouchers/${id}`);
        setVouchers((prev) => prev.filter((v) => v.id !== id));
      } catch (err) {
        alert('Không thể xóa Voucher.');
      }
    }
  };

  const copyCode = (voucherCode: string) => {
    navigator.clipboard.writeText(voucherCode);
    setCopiedCode(voucherCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Quản Lý Voucher & Mã Giảm Giá (Database API Real)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo và quản lý mã giảm giá ưu đãi khi mua quyền đọc sách số 10.000 VNĐ qua VietQR SePay.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button onClick={() => setIsModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Tạo Voucher Mới
          </Button>
          <Button onClick={fetchVouchers} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Vouchers Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Danh Sách Mã Giảm Giá Trong Database ({vouchers.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Đang tải danh sách voucher từ database...</div>
          ) : vouchers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Chưa có voucher nào trong database.</div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Mã Voucher</th>
                  <th className="px-4 py-3">Mức giảm giá</th>
                  <th className="px-4 py-3">Lượt sử dụng</th>
                  <th className="px-4 py-3">Ngày hết hạn</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vouchers.map((v) => {
                  const isActive = v.status === 'ACTIVE';

                  return (
                    <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5 flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                          {v.code}
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyCode(v.code)}>
                          {copiedCode === v.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {v.discountType === 'PERCENT' ? `Giảm ${v.discountValue}%` : `Giảm ${v.discountValue.toLocaleString('vi-VN')} VNĐ`}
                      </td>

                      <td className="px-4 py-3.5 font-medium">
                        {v.usedCount} / {v.maxUsage} lượt
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {new Date(v.expiresAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-emerald-600' : ''}>
                          {isActive ? 'Đang hoạt động' : 'Hết hạn'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)} className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Modal Tạo Voucher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Tạo Mã Voucher Mới</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <Label htmlFor="vCode" className="text-xs font-semibold">Mã Voucher (Viết hoa, không dấu) *</Label>
                <Input
                  id="vCode"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: KHUYENMAI50"
                  className="font-mono text-xs uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold block mb-1">Loại giảm giá</Label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-xs font-medium"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="vVal" className="text-xs font-semibold">Giá trị giảm *</Label>
                  <Input
                    id="vVal"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vMax" className="text-xs font-semibold">Giới hạn lượt dùng *</Label>
                  <Input
                    id="vMax"
                    type="number"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="vExp" className="text-xs font-semibold">Ngày hết hạn *</Label>
                  <Input
                    id="vExp"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit">Lưu Voucher</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
