'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/shared/StarRating';
import { Badge } from '@/components/ui/badge';
import type { Review } from '@/types/Review';

/**
 * Thuộc tính của component hiển thị bài đánh giá của chính người dùng hiện tại.
 */
export interface UserReviewCardProps {
  /** Dữ liệu bài đánh giá của người dùng hiện tại */
  review: Review;
  /** Callback chuyển sang chế độ chỉnh sửa bài viết */
  onEdit: () => void;
  /** Callback xác nhận xóa bài viết */
  onDelete: (reviewId: string) => Promise<void>;
}

/**
 * UserReviewCard - Hiển thị nổi bật bài đánh giá của chính người dùng đã đăng nhập.
 * Cho phép chỉnh sửa hoặc mở modal xác nhận xóa an toàn.
 *
 * Dùng ở: ReviewsSection của trang chi tiết sách.
 */
export function UserReviewCard({ review, onEdit, onDelete }: UserReviewCardProps) {
  // Trạng thái hiển thị dialog xác nhận xóa nhằm tránh nguy cơ người dùng lỡ tay bấm xóa bài viết
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  // Trạng thái chờ trong khi gọi API xóa bài đánh giá để vô hiệu hóa nút bấm và hiển thị spinner
  const [isDeleting, setIsDeleting] = useState(false);

  // Lắng nghe sự kiện phím Escape để đóng hộp thoại xác nhận xóa nhằm tăng trải nghiệm trợ năng (a11y)
  useEffect(() => {
    if (!showConfirmDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        setShowConfirmDelete(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmDelete, isDeleting]);

  // Xử lý gọi callback onDelete và quản lý trạng thái loading để ngăn người dùng thao tác trùng lặp
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(review.id);
      setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-5 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-4 shadow-xs relative">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-primary text-primary-foreground font-semibold text-xs">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Đánh giá của bạn
          </Badge>
          {review.isEdited && (
            <span className="text-[11px] text-muted-foreground font-medium">
              (đã chỉnh sửa)
            </span>
          )}
        </div>

        {/* Nút Chỉnh sửa & Xóa bài đánh giá cá nhân */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 text-xs font-medium cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            Chỉnh sửa
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowConfirmDelete(true)}
            className="h-8 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Xóa
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <StarRating rating={review.rating} size={16} />
        <span className="text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
        {review.comment}
      </p>

      {/* Dialog xác nhận xóa an toàn: Sử dụng modal backdrop để ngăn thao tác xóa vô tình và giải thích hậu quả của việc xóa bài đánh giá */}
      {showConfirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-card border rounded-xl p-6 shadow-xl space-y-4">
            <h4 id="delete-dialog-title" className="text-base font-bold text-foreground">
              Xác nhận xóa bài đánh giá?
            </h4>
            <p className="text-sm text-muted-foreground">
              Bài đánh giá của bạn sẽ bị xóa vĩnh viễn và điểm đánh giá trung bình của cuốn sách sẽ được cập nhật lại.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowConfirmDelete(false)}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleDelete}
                className="cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa đánh giá'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
