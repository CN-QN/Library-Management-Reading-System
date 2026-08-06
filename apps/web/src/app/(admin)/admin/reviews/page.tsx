'use client';

import React, { useEffect, useState } from 'react';
import { Star, CheckCircle2, XCircle, Trash2, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ReviewRecord {
  id: string;
  bookId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userAvatarUrl?: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter === 'ALL' ? '/reviews/admin/all' : `/reviews/admin/all?status=${statusFilter}`;
      const res = await apiClient.get(url);
      const data = res.data?.data?.items || res.data?.data || [];
      setReviews(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleModerate = async (reviewId: string, newStatus: string) => {
    setActionId(reviewId);
    try {
      await apiClient.patch(`/reviews/${reviewId}/status?status=${newStatus}`);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert('Lỗi khi duyệt bài đánh giá. Vui lòng thử lại.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn bài đánh giá này?')) return;
    setActionId(reviewId);
    try {
      await apiClient.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert('Lỗi khi xóa bài đánh giá.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Kiểm Duyệt Đánh Giá & Bình Luận</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý và duyệt nhận xét của độc giả, lọc bỏ đánh giá vi phạm hoặc rác.
          </p>
        </div>

        <Button onClick={fetchReviews} variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tất cả bài đánh giá' },
            { id: 'PENDING', label: 'Chờ kiểm duyệt' },
            { id: 'APPROVED', label: 'Đã duyệt' },
            { id: 'REJECTED', label: 'Đã từ chối' },
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
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="py-12 text-center text-muted-foreground text-sm">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
            Đang tải bài đánh giá...
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="py-12 text-center text-muted-foreground text-sm">
            <AlertCircle className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
            Không có bài đánh giá nào trong danh mục này.
          </Card>
        ) : (
          reviews.map((item) => {
            const isApproved = item.status === 'APPROVED';
            const isRejected = item.status === 'REJECTED';
            const isPending = item.status === 'PENDING';

            return (
              <Card key={item.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <Avatar className="h-9 w-9 border border-border shrink-0 mt-0.5">
                      <AvatarImage src={item.userAvatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {item.userFullName?.substring(0, 2).toUpperCase() || 'DG'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{item.userFullName}</span>
                        <span className="text-xs text-muted-foreground font-mono">({item.userEmail})</span>
                        <Badge
                          variant={isApproved ? 'default' : isRejected ? 'destructive' : 'secondary'}
                          className={isApproved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        >
                          {isApproved ? 'Đã duyệt' : isRejected ? 'Đã từ chối' : 'Chờ duyệt'}
                        </Badge>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                        <span className="text-xs font-bold text-foreground ml-1.5">{item.rating}/5 sao</span>
                      </div>

                      <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/50 mt-1">
                        "{item.comment}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                    {!isApproved && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-xs"
                        disabled={actionId === item.id}
                        onClick={() => handleModerate(item.id, 'APPROVED')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Duyệt
                      </Button>
                    )}

                    {!isRejected && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        disabled={actionId === item.id}
                        onClick={() => handleModerate(item.id, 'REJECTED')}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Từ chối
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      disabled={actionId === item.id}
                      onClick={() => handleDelete(item.id)}
                      title="Xóa đánh giá"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
