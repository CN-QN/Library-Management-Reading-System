'use client';

import { ReviewsSection } from './ReviewsSection';
import { useBookRating } from './BookRatingSync';

/**
 * ConnectedReviewsSection — bọc ReviewsSection với callback đồng bộ rating.
 *
 * Tự động truyền `onStatsChange` từ BookRatingContext vào ReviewsSection,
 * giúp hero section cập nhật rating realtime khi có thay đổi đánh giá.
 */
export function ConnectedReviewsSection({ bookId }: { bookId: string }) {
  const { handleStatsChange } = useBookRating();
  return (
    <ReviewsSection
      bookId={bookId}
      onStatsChange={handleStatsChange}
    />
  );
}
