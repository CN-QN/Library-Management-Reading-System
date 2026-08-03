/**
 * Interface cho dữ liệu Đánh giá & Bình luận của người dùng.
 */
export interface Review {
  id: string;
  bookId: string;
  userId: string;
  displayName: string;
  /** Số sao đánh giá từ 1 đến 5 */
  rating: number;
  /** Nội dung nhận xét */
  comment: string;
  /** Chuỗi thời gian ISO 8601 */
  createdAt: string;
}

const REVIEWS_STORAGE_PREFIX = 'reader_reviews_';

/** Fixture dữ liệu mẫu phục vụ hiển thị ban đầu nếu cuốn sách chưa có bình luận nào */
const INITIAL_MOCK_REVIEWS: Record<string, Omit<Review, 'id' | 'createdAt'>[]> = {
  default: [
    {
      bookId: 'default',
      userId: 'user_sample_1',
      displayName: 'Nguyễn Văn An',
      rating: 5,
      comment: 'Cuốn sách rất hay và giàu cảm xúc. Tác giả có văn phong rất lôi cuốn!',
    },
    {
      bookId: 'default',
      userId: 'user_sample_2',
      displayName: 'Trần Thị Bình',
      rating: 4,
      comment: 'Nội dung ý nghĩa, thích hợp cho những ai muốn tìm một trải nghiệm đọc nhẹ nhàng.',
    },
  ],
};

/**
 * Lấy danh sách đánh giá của cuốn sách (kết hợp fixture ban đầu và dữ liệu trong localStorage).
 */
export function getReviews(bookId: string): Review[] {
  if (typeof window === 'undefined') return [];

  try {
    const key = `${REVIEWS_STORAGE_PREFIX}${bookId}`;
    const raw = localStorage.getItem(key);
    const storedReviews: Review[] = raw ? JSON.parse(raw) : [];

    // Nếu chưa có review trong storage, trả về dữ liệu fixture mẫu
    if (storedReviews.length === 0) {
      const fixtures = INITIAL_MOCK_REVIEWS[bookId] || INITIAL_MOCK_REVIEWS['default'];
      return fixtures.map((f, idx) => ({
        ...f,
        id: `mock_review_${bookId}_${idx}`,
        bookId,
        createdAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
      }));
    }

    return storedReviews;
  } catch {
    return [];
  }
}

/**
 * Gửi đánh giá mới cho cuốn sách.
 * Kiểm tra tính hợp lệ của rating (1-5) và nội dung nhận xét trước khi lưu vào localStorage.
 */
export function submitReview(input: Omit<Review, 'id' | 'createdAt'>): Review {
  const trimmedComment = input.comment.trim();

  if (input.rating < 1 || input.rating > 5) {
    throw new Error('Số sao đánh giá phải từ 1 đến 5.');
  }

  if (!trimmedComment || trimmedComment.length < 3) {
    throw new Error('Nội dung nhận xét phải có ít nhất 3 ký tự.');
  }

  const newReview: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    bookId: input.bookId,
    userId: input.userId,
    displayName: input.displayName || 'Độc giả ẩn danh',
    rating: Math.floor(input.rating),
    comment: trimmedComment,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const key = `${REVIEWS_STORAGE_PREFIX}${input.bookId}`;
      const existing = getReviews(input.bookId);
      const updated = [newReview, ...existing];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error('Không thể lưu review vào localStorage:', e);
    }
  }

  return newReview;
}
