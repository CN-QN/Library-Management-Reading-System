'use client';

import { StarRating } from '@/components/shared/StarRating';
import { useBookRating } from './BookRatingSync';

/**
 * LiveStarRating — hiển thị rating với giá trị cập nhật realtime từ BookRatingContext.
 *
 * Thay thế StarRating tĩnh trong hero metadata để rating tự động
 * cập nhật khi người dùng gửi/sửa/xóa đánh giá mà không cần reload trang.
 */
export function LiveStarRating() {
  const { liveRating } = useBookRating();
  return <StarRating rating={liveRating} />;
}
