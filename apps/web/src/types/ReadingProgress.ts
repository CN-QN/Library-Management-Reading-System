import { Book } from './Book';

export interface ReadingProgress {
  bookId: string;
  book: Book;
  /** Phần trăm hoàn thành (từ 0 đến 100) */
  progressPercentage: number;
  /** Thời điểm đọc lần cuối, chuỗi ISO 8601 */
  lastReadAt: string;
  currentChapterId?: string;
  currentChapterTitle?: string;
}
