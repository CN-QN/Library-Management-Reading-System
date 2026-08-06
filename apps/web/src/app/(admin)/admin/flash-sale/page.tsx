'use client';

import React, { useState } from 'react';
import { Zap, Plus, Clock, Tag, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface FlashSaleItem {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  startTime: string;
  endTime: string;
  status: 'RUNNING' | 'UPCOMING' | 'ENDED';
}

export default function AdminFlashSalePage() {
  const [sales, setSales] = useState<FlashSaleItem[]>([
    {
      id: '1',
      name: 'Giờ Vàng Giá Sách 5.000 VNĐ - Hè 2026',
      originalPrice: 10000,
      salePrice: 5000,
      startTime: '2026-08-06T00:00:00',
      endTime: '2026-08-06T23:59:59',
      status: 'RUNNING',
    },
    {
      id: '2',
      name: 'Flash Sale Ngày Cuối Tuần',
      originalPrice: 10000,
      salePrice: 3000,
      startTime: '2026-08-08T08:00:00',
      endTime: '2026-08-08T22:00:00',
      status: 'UPCOMING',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState(5000);
  const [endTime, setEndTime] = useState('2026-08-07T23:59');

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên chương trình Flash Sale!');
      return;
    }

    const newItem: FlashSaleItem = {
      id: Date.now().toString(),
      name,
      originalPrice: 10000,
      salePrice: Number(salePrice),
      startTime: new Date().toISOString(),
      endTime,
      status: 'RUNNING',
    };

    setSales([newItem, ...sales]);
    setIsModalOpen(false);
    setName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Xóa chương trình Flash Sale này?')) {
      setSales((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500 fill-amber-500" />
            Quản Lý Sự Kiện Flash Sale Đếm Ngược
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo sự kiện Flash Sale ưu đãi giá sách 10.000đ xuống 5.000đ hiển thị kèm đồng hồ đếm ngược trên UI Trang chủ.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 self-start sm:self-auto bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4" />
          Tạo Flash Sale Mới
        </Button>
      </div>

      {/* Sales List */}
      <div className="grid grid-cols-1 gap-4">
        {sales.map((sale) => {
          const isRunning = sale.status === 'RUNNING';

          return (
            <Card key={sale.id} className="hover:border-amber-500/40 transition-colors border-l-4 border-l-amber-500">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground">{sale.name}</h3>
                    <Badge variant={isRunning ? 'default' : 'secondary'} className={isRunning ? 'bg-amber-600 animate-pulse' : ''}>
                      {isRunning ? '🔥 Đang diễn ra' : 'Sắp diễn ra'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Tag className="h-3.5 w-3.5" />
                      Giá ưu đãi: <strong className="text-sm">{sale.salePrice.toLocaleString('vi-VN')} VNĐ</strong> (Gốc: {sale.originalPrice.toLocaleString('vi-VN')}đ)
                    </span>

                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Kết thúc: {new Date(sale.endTime).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(sale.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Tạo Flash Sale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Tạo Đợt Flash Sale Mới</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4">
              <div>
                <Label htmlFor="fsName" className="text-xs font-semibold">Tên chương trình Flash Sale *</Label>
                <Input
                  id="fsName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Giờ Vàng Giá Sách 5.000 VNĐ"
                />
              </div>

              <div>
                <Label htmlFor="fsPrice" className="text-xs font-semibold">Giá bán Flash Sale (VNĐ) *</Label>
                <Input
                  id="fsPrice"
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="font-bold text-amber-600"
                />
              </div>

              <div>
                <Label htmlFor="fsEnd" className="text-xs font-semibold">Thời gian kết thúc sự kiện *</Label>
                <Input
                  id="fsEnd"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Bật Flash Sale</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
