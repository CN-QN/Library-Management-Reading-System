'use client';

import React from 'react';
import { StarRating } from '@/components/shared/StarRating';
import type { Review } from '@/types/Review';

/**
 * Thuộc tính của component hiển thị một bài đánh giá của độc giả khác.
 */
export interface ReviewItemProps {
  /** Dữ liệu bài đánh giá của độc giả bao gồm điểm số, nhận xét và thông tin người dùng */
  review: Review;
}

/**
 * ReviewItem - Hiển thị chi tiết một bài đánh giá từ độc giả khác trong cộng đồng.
 * Bao gồm avatar tên viết tắt, tên người dùng, số sao, ngày đăng và nội dung nhận xét.
 *
 * Dùng ở: ReviewsSection của trang chi tiết sách.
 */
export function ReviewItem({ review }: ReviewItemProps) {
  // Lấy chữ cái đầu làm avatar fallback khi người dùng chưa cập nhật avatar URL
  // Lý do: Đảm bảo giao diện đồng bộ, hiển thị đẹp mắt và không bị vỡ khung hình khi thiếu ảnh đại diện
  const initialLetter = (review.userFullName || 'Đ').charAt(0).toUpperCase();

  return (
    <div className="p-4 rounded-xl border bg-card/60 space-y-3 shadow-xs hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar dạng initials đại diện cho độc giả khi chưa có hình đại diện riêng */}
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
            {initialLetter}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground leading-tight">
                {review.userFullName}
              </h4>
              {review.isEdited && (
                <span className="text-[10px] text-muted-foreground font-normal">
                  (đã chỉnh sửa)
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        <StarRating rating={review.rating} size={14} />
      </div>

      <p className="text-sm text-foreground/90 pl-12 whitespace-pre-line leading-relaxed">
        {review.comment}
      </p>
    </div>
  );
}
