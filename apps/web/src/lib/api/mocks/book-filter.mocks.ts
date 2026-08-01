export type BookFilterOption = {
  value: string;
  label: string;
};

export type BookSortOption = BookFilterOption & {
  /** Backend field expected by the books API query contract. */
  sortBy: 'createdAt' | 'viewCount';
  sortOrder: 'desc' | 'asc';
  /** true nếu backend hiện chưa bảo đảm áp dụng đúng logic sắp xếp này. */
  backendPending?: boolean;
};

export const BOOK_CATEGORY_FILTERS: BookFilterOption[] = [
  { value: 'c1', label: 'Khoa học' },
  { value: 'c2', label: 'Tiểu thuyết' },
  { value: 'c3', label: 'Lịch sử' },
  { value: 'c4', label: 'Kinh doanh' },
  { value: 'c5', label: 'Tâm lý học' },
  { value: 'c6', label: 'Thiếu nhi' },
  { value: 'c7', label: 'Phát triển bản thân' },
];

export const BOOK_LANGUAGE_FILTERS: BookFilterOption[] = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'Tiếng Anh' },
];

export const BOOK_AVAILABILITY_FILTERS: BookFilterOption[] = [
  { value: 'FREE', label: 'Có bản đọc online' },
  { value: 'PHYSICAL', label: 'Có thể mượn bản in' },
];

export const BOOK_SORT_OPTIONS: BookSortOption[] = [
  { value: 'newest', label: 'Mới nhất', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'popular', label: 'Phổ biến nhất', sortBy: 'viewCount', sortOrder: 'desc', backendPending: true },
  { value: 'trending', label: 'Thịnh hành', sortBy: 'viewCount', sortOrder: 'desc', backendPending: true },
];
