export interface Book {
  id: string;
  title: string;
  author: string;
  /** URL tuyệt đối đến ảnh bìa sách */
  coverImage?: string;
  rating?: number;
  description?: string;
  categoryIds?: string[];
  /** Trạng thái xuất bản: "Published", "Draft", v.v. */
  status?: string;
  /** Chuỗi ISO 8601 (vd: "2026-07-29T10:00:00Z") */
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

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
