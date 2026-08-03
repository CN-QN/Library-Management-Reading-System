'use client';

import { BookHeroActions } from './BookHeroActions';
import { ChapterList } from './ChapterList';
import { BookRecommendations } from './BookRecommendations';
import { ReviewsSection } from './ReviewsSection';
import type {
  BookDetail,
  ChapterSummary,
  ReadingProgressDetail,
  BookRecommendation,
  BookFile,
} from '@/types/BookDetail';

export interface BookDetailInteractiveProps {
  /** Thông tin chi tiết cuốn sách */
  book: BookDetail;
  /** Chương đầu tiên (phục vụ nút Bắt đầu đọc) */
  firstChapter: ChapterSummary | null;
  /** Tiến độ đọc của người dùng hiện tại (nếu có) */
  progress: ReadingProgressDetail | null;
  /** Thông điệp lỗi tiến độ (nếu có, dạng string serializable) */
  progressError?: string | null;
  /** Danh sách sách gợi ý cho bạn */
  recommendations: BookRecommendation[];
  /** Danh sách các chương sách */
  chapters: ChapterSummary[];
  /** Thông điệp lỗi tải danh sách chương (nếu có, dạng string serializable) */
  chaptersError: string | null;
  /** Thông tin file nội dung tải xuống */
  contentFile: BookFile | null;
}

/**
 * BookDetailInteractive - Wrapper kết hợp các thành phần tương tác của trang chi tiết sách.
 * 
 * Lưu ý: Trong layout mới, các component con (BookHeroActions, ChapterList, BookRecommendations, ReviewsSection)
 * được import trực tiếp trong page.tsx để danh sách chương và review có thể căn giữa và trải rộng toàn trang.
 */
export function BookDetailInteractive({
  book,
  firstChapter,
  progress,
  recommendations,
  chapters,
  chaptersError,
  contentFile,
}: BookDetailInteractiveProps) {
  return (
    <div className="space-y-12">
      <BookHeroActions
        book={book}
        firstChapter={firstChapter}
        progress={progress}
      />

      <ChapterList
        bookSlug={book.slug}
        chapters={chapters}
        error={chaptersError}
        contentFile={contentFile}
      />

      <BookRecommendations
        recommendations={recommendations}
        currentBookId={book.id}
        currentBookSlug={book.slug}
      />

      <ReviewsSection
        bookId={book.id}
      />
    </div>
  );
}
