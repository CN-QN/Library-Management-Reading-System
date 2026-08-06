'use client';

import React, { useEffect, useState } from 'react';
import { Library, Plus, Search, CheckCircle2, Clock, AlertTriangle, RefreshCw, BookOpen } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface BorrowingItem {
  id: string;
  code: string;
  userId: string;
  userName?: string;
  studentCode?: string;
  status: string;
  expectedReturnAt: string;
  createdAt: string;
}

export default function AdminBorrowingsPage() {
  const [borrowings, setBorrowings] = useState<BorrowingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form State Lập phiếu mượn
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userId, setUserId] = useState('');
  const [copyId, setCopyId] = useState('');
  const [dueDays, setDueDays] = useState(14);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchBorrowings = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter === 'ALL' ? '/borrowings?limit=50' : `/borrowings?status=${statusFilter}&limit=50`;
      const res = await apiClient.get(url);
      const data = res.data?.data?.items || res.data?.data || [];
      setBorrowings(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách phiếu mượn:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowings();
  }, [statusFilter]);

  const handleCreateBorrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !copyId.trim()) {
      alert('Vui lòng điền đầy đủ User ID độc giả và Mã bản sao sách!');
      return;
    }

    try {
      await apiClient.post('/borrowings', {
        userId,
        items: [{ copyId, returnDueDate: new Date(Date.now() + dueDays * 86400000).toISOString() }],
      });
      setIsModalOpen(false);
      setUserId('');
      setCopyId('');
      fetchBorrowings();
    } catch (err) {
      alert('Không thể tạo phiếu mượn. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleReturnBorrowing = async (borrowingId: string) => {
    if (!confirm('Xác nhận độc giả đã trả sách cho phiếu mượn này?')) return;
    setActionId(borrowingId);
    try {
      await apiClient.post(`/borrowings/${borrowingId}/return`, { items: [] });
      setBorrowings((prev) =>
        prev.map((b) => (b.id === borrowingId ? { ...b, status: 'RETURNED' } : b))
      );
    } catch (err) {
      alert('Không thể cập nhật trả sách.');
    } finally {
      setActionId(null);
    }
  };

  const filtered = borrowings.filter((b) =>
    (b.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.studentCode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Quản Lý Mượn / Trả Sách Giấy Tại Quầy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý phiếu mượn sách vật lý, theo dõi sách sắp hết hạn, quá hạn và làm thủ tục trả sách cho độc giả.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          + Lập Phiếu Mượn
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã phiếu, tên độc giả, mã SV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'Tất cả trạng thái' },
              { id: 'BORROWED', label: 'Đang mượn' },
              { id: 'DUE_SOON', label: 'Sắp hết hạn' },
              { id: 'OVERDUE', label: 'Quá hạn' },
              { id: 'RETURNED', label: 'Đã trả' },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={statusFilter === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab.id)}
                className="text-xs font-medium shrink-0"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            Danh Sách Phiếu Mượn ({filtered.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              Đang tải danh sách phiếu mượn...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Không tìm thấy phiếu mượn nào phù hợp.
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Mã phiếu</th>
                  <th className="px-4 py-3">Độc giả mượn</th>
                  <th className="px-4 py-3">Hạn trả</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const isReturned = item.status === 'RETURNED';
                  const isOverdue = item.status === 'OVERDUE';

                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-primary">
                        #{item.code || item.id.substring(0, 8)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-foreground block">{item.userName || 'Độc giả'}</span>
                        <span className="text-xs text-muted-foreground font-mono">{item.studentCode || item.userId}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">
                        {item.expectedReturnAt ? new Date(item.expectedReturnAt).toLocaleDateString('vi-VN') : '14 ngày'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant={isReturned ? 'secondary' : isOverdue ? 'destructive' : 'default'}
                          className={!isReturned && !isOverdue ? 'bg-emerald-600' : ''}
                        >
                          {isReturned ? 'Đã trả' : isOverdue ? 'Quá hạn' : 'Đang mượn'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {!isReturned && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-xs"
                            disabled={actionId === item.id}
                            onClick={() => handleReturnBorrowing(item.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Xác nhận trả
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Modal Lập phiếu mượn */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Lập Phiếu Mượn Sách Mới</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleCreateBorrowing} className="space-y-4">
              <div>
                <Label htmlFor="bUserId" className="text-xs font-semibold">User ID Độc giả *</Label>
                <Input
                  id="bUserId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Nhập ID độc giả (VD: 60f...)"
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="bCopyId" className="text-xs font-semibold">Mã bản sao sách (Copy ID / Barcode) *</Label>
                <Input
                  id="bCopyId"
                  value={copyId}
                  onChange={(e) => setCopyId(e.target.value)}
                  placeholder="Quét hoặc nhập mã vạch sách..."
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="bDueDays" className="text-xs font-semibold">Thời hạn mượn (ngày)</Label>
                <Input
                  id="bDueDays"
                  type="number"
                  value={dueDays}
                  onChange={(e) => setDueDays(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit">Lập phiếu mượn</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
