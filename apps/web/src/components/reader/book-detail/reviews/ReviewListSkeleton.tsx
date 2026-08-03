import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ReviewListSkeleton - Hiển thị placeholder dạng skeleton khi danh sách đánh giá đang được tải.
 * Giúp giao diện không bị giật layout (Cumulative Layout Shift) trong khi chờ dữ liệu.
 *
 * Dùng ở: ReviewsSection của trang chi tiết sách.
 */
export function ReviewListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải danh sách đánh giá">
      {/* Hiển thị 3 khung skeleton đại diện cho 3 bài đánh giá đang được tải */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-xl border bg-card/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Skeleton đại diện cho Avatar người dùng */}
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="space-y-1.5">
                {/* Skeleton cho tên người dùng và thời gian đánh giá */}
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
            {/* Skeleton cho điểm đánh giá sao */}
            <Skeleton className="w-24 h-4" />
          </div>
          {/* Skeleton cho nội dung bài đánh giá */}
          <Skeleton className="w-full h-12 rounded-md" />
        </div>
      ))}
    </div>
  );
}
