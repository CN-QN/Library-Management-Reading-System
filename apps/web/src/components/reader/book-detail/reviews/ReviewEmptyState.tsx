import React from 'react';
import { MessageSquareDashed, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Thuộc tính của component ReviewEmptyState.
 */
export interface ReviewEmptyStateProps {
  /** Có đang áp dụng bộ lọc mức sao hay không */
  isFiltered?: boolean;
  /** Callback khi bấm nút quay lại xem tất cả đánh giá */
  onResetFilter?: () => void;
}

/**
 * ReviewEmptyState - Hiển thị trạng thái rỗng khi chưa có đánh giá nào hoặc không có kết quả phù hợp với bộ lọc.
 *
 * Dùng ở: ReviewsSection của trang chi tiết sách.
 *
 * @param isFiltered - Trạng thái cho biết người dùng có đang áp dụng lọc theo mức sao không
 * @param onResetFilter - Hàm callback để đặt lại bộ lọc về mặc định (xem tất cả đánh giá)
 */
export function ReviewEmptyState({ isFiltered = false, onResetFilter }: ReviewEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed text-center bg-card/30 space-y-3">
      {/* Icon hiển thị trạng thái chưa có bình luận/đánh giá */}
      <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
        <MessageSquareDashed className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-foreground">
          {isFiltered ? 'Không có đánh giá nào phù hợp' : 'Chưa có đánh giá nào'}
        </h4>
        <p className="text-xs text-muted-foreground">
          {isFiltered
            ? 'Không có bài đánh giá nào khớp với mức sao bạn đã chọn.'
            : 'Hãy là người đầu tiên chia sẻ cảm nhận về cuốn sách này!'}
        </p>
      </div>

      {/* Hiển thị nút xóa bộ lọc nếu đang áp dụng lọc sao và có truyền hàm onResetFilter */}
      {isFiltered && onResetFilter && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetFilter}
          className="h-8 text-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Xem tất cả đánh giá
        </Button>
      )}
    </div>
  );
}
