import type {
  Review,
  ReviewStats,
  GetReviewsParams,
  PaginatedReviewsResponse,
  CreateReviewPayload,
  UpdateReviewPayload,
} from '@/types/Review';

/**
 * Tiền tố key lưu trữ danh sách đánh giá theo ID sách trong LocalStorage.
 * Giúp cô lập dữ liệu đánh giá giữa các cuốn sách khác nhau trong môi trường chưa có API backend thật.
 */
const REVIEWS_STORAGE_PREFIX = 'reader_book_reviews_';

/**
 * Fixtures đánh giá mẫu sinh động phục vụ trải nghiệm người dùng ban đầu.
 * Đóng vai trò là dữ liệu mồi khởi tạo khi chưa có đánh giá nào cho sách trong LocalStorage.
 */
const INITIAL_SEED_REVIEWS: Record<string, Omit<Review, 'id' | 'createdAt'>[]> = {
  default: [
    {
      bookId: 'default',
      userId: 'seed_user_1',
      userFullName: 'Nguyễn Văn An',
      userEmail: 'an.nguyen@example.com',
      rating: 5,
      comment: 'Cuốn sách rất hay và giàu cảm xúc. Tác giả có văn phong lôi cuốn, truyền tải nhiều thông điệp ý nghĩa!',
      isEdited: false,
    },
    {
      bookId: 'default',
      userId: 'seed_user_2',
      userFullName: 'Trần Thị Bình',
      userEmail: 'binh.tran@example.com',
      rating: 5,
      comment: 'Một tác phẩm tuyệt vời cho những ai yêu thích thể loại này. Sách trình bày đẹp, nội dung sâu sắc.',
      isEdited: false,
    },
    {
      bookId: 'default',
      userId: 'seed_user_3',
      userFullName: 'Lê Hoàng Long',
      userEmail: 'long.le@example.com',
      rating: 4,
      comment: 'Nội dung rất bổ ích, tuy nhiên phần kết hơi nhanh một chút. Đáng để đọc và suy ngẫm!',
      isEdited: false,
    },
    {
      bookId: 'default',
      userId: 'seed_user_4',
      userFullName: 'Phạm Minh Đức',
      userEmail: 'duc.pham@example.com',
      rating: 4,
      comment: 'Sách cung cấp góc nhìn mới mẻ và thực tế. Rất phù hợp cho sinh viên nghiên cứu.',
      isEdited: false,
    },
    {
      bookId: 'default',
      userId: 'seed_user_5',
      userFullName: 'Vũ Hải Yến',
      userEmail: 'yen.vu@example.com',
      rating: 3,
      comment: 'Sách đọc tạm ổn, ngôn từ dễ hiểu nhưng diễn biến chưa thực sự có nhiều đột phá.',
      isEdited: false,
    },
    {
      bookId: 'default',
      userId: 'seed_user_6',
      userFullName: 'Đỗ Quốc Cường',
      userEmail: 'cuong.do@example.com',
      rating: 5,
      comment: 'Rất ấn tượng với cách phát triển nhân vật. Tôi đã đọc một mạch hết cuốn sách trong 2 ngày.',
      isEdited: false,
    },
  ],
};

/**
 * Đọc danh sách bài đánh giá của một cuốn sách từ LocalStorage.
 * Nếu chưa có dữ liệu (lần đầu truy cập), tự động mồi dữ liệu từ INITIAL_SEED_REVIEWS để UI luôn có dữ liệu phong phú.
 *
 * @param bookId - ID của cuốn sách cần lấy danh sách đánh giá
 * @returns Mảng các bài đánh giá `Review[]`. Trả về mảng rỗng nếu môi trường là SSR (Server-Side Rendering).
 */
function getStoredReviews(bookId: string): Review[] {
  // Tránh lỗi ReferenceError khi chạy trong môi trường Server-Side Rendering (Next.js SSR)
  if (typeof window === 'undefined') return [];
  try {
    const key = `${REVIEWS_STORAGE_PREFIX}${bookId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Tự động mồi dữ liệu mẫu để tạo trải nghiệm người dùng sống động khi mở trang lần đầu
      const fixtures = INITIAL_SEED_REVIEWS[bookId] || INITIAL_SEED_REVIEWS['default'];
      const seeded: Review[] = fixtures.map((f, idx) => ({
        ...f,
        id: `seed_rev_${bookId}_${idx + 1}`,
        bookId,
        // Tạo khoảng thời gian ngày tạo lùi lại tương đối để danh sách có độ phân bổ ngày tháng thực tế
        createdAt: new Date(Date.now() - (idx + 1) * 86400000 * 2).toISOString(),
      }));
      localStorage.setItem(key, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Review[];
  } catch {
    // Trả về mảng rỗng nếu LocalStorage bị khoá hoặc JSON parse thất bại
    return [];
  }
}

/**
 * Ghi đè danh sách bài đánh giá của một cuốn sách vào LocalStorage.
 *
 * @param bookId - ID cuốn sách
 * @param reviews - Danh sách bài đánh giá mới cần lưu
 */
function saveStoredReviews(bookId: string, reviews: Review[]): void {
  // Kiểm tra môi trường SSR trước khi tương tác với window.localStorage
  if (typeof window === 'undefined') return;
  try {
    const key = `${REVIEWS_STORAGE_PREFIX}${bookId}`;
    localStorage.setItem(key, JSON.stringify(reviews));
  } catch (error) {
    // Bắt lỗi bộ nhớ LocalStorage bị đầy hoặc môi trường vô hiệu hóa bộ nhớ tạm
    console.error('Không thể lưu đánh giá vào LocalStorage:', error);
  }
}

/**
 * Lấy danh sách đánh giá của sách với bộ lọc, sắp xếp và phân trang.
 * Mô phỏng độ trễ mạng async 200ms để hiển thị skeleton UI mượt mà.
 *
 * @param params - Tham số phân trang, lọc theo số sao và sắp xếp
 * @returns Promise chứa dữ liệu danh sách đánh giá đã phân trang và tổng số trang/item
 */
export async function getReviews(params: GetReviewsParams): Promise<PaginatedReviewsResponse> {
  const { bookId, page = 1, limit = 5, ratingFilter = 'all', sortBy = 'newest' } = params;

  // Giả lập độ trễ mạng 200ms để UI thể hiện trạng thái loading/skeleton mượt mà
  await new Promise((resolve) => setTimeout(resolve, 200));

  let list = getStoredReviews(bookId);

  // Lọc theo mức sao nếu người dùng chọn bộ lọc cụ thể (1-5 sao)
  if (ratingFilter !== 'all') {
    list = list.filter((r) => r.rating === ratingFilter);
  }

  // Sắp xếp danh sách dựa theo tiêu chí người dùng lựa chọn trên giao diện
  if (sortBy === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'highest') {
    list.sort((a, b) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'lowest') {
    list.sort((a, b) => a.rating - b.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  // Đảm bảo trang nằm trong phạm vi hợp lệ [1, totalPages] để tránh đứt gãy giao diện
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (safePage - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);

  return {
    items,
    page: safePage,
    limit,
    totalItems,
    totalPages,
  };
}

/**
 * Tính toán thống kê điểm trung bình và phân bổ số sao của sách.
 *
 * @param bookId - ID cuốn sách cần tính toán thống kê
 * @returns Promise chứa thông tin thống kê `ReviewStats`
 */
export async function getReviewStats(bookId: string): Promise<ReviewStats> {
  // Giả lập độ trễ mạng 100ms
  await new Promise((resolve) => setTimeout(resolve, 100));
  const list = getStoredReviews(bookId);
  const totalReviews = list.length;

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const r of list) {
    // Ép kiểu điểm số về phạm vi nguyên [1..5] để đảm bảo chỉ số phân bổ sao chính xác
    const star = Math.min(5, Math.max(1, Math.floor(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] = (distribution[star] || 0) + 1;
    sum += r.rating;
  }

  // Làm tròn điểm trung bình đến 1 chữ số thập phân (ví dụ: 4.7)
  const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;
  const percentages: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: totalReviews > 0 ? Math.round((distribution[1] / totalReviews) * 100) : 0,
    2: totalReviews > 0 ? Math.round((distribution[2] / totalReviews) * 100) : 0,
    3: totalReviews > 0 ? Math.round((distribution[3] / totalReviews) * 100) : 0,
    4: totalReviews > 0 ? Math.round((distribution[4] / totalReviews) * 100) : 0,
    5: totalReviews > 0 ? Math.round((distribution[5] / totalReviews) * 100) : 0,
  };

  return {
    averageRating,
    totalReviews,
    distribution,
    percentages,
  };
}

/**
 * Lấy bài đánh giá của chính người dùng hiện tại đối với cuốn sách (nếu có).
 *
 * @param bookId - ID cuốn sách
 * @param userId - ID người dùng hiện tại
 * @returns Promise chứa bài đánh giá `Review` của người dùng hoặc `null` nếu chưa đánh giá
 */
export async function getUserReview(bookId: string, userId: string): Promise<Review | null> {
  if (!userId) return null;
  // Giả lập độ trễ mạng 100ms
  await new Promise((resolve) => setTimeout(resolve, 100));
  const list = getStoredReviews(bookId);
  return list.find((r) => r.userId === userId) || null;
}

/**
 * Gửi bài đánh giá mới.
 * Kiểm tra các ràng buộc nghiệp vụ: phải đăng nhập, rating 1-5 sao, độ dài nhận xét 10-1000 ký tự, mỗi user chỉ gửi 1 review / sách.
 *
 * @param payload - Thông tin bài đánh giá tạo mới
 * @returns Promise chứa bài đánh giá `Review` vừa tạo thành công
 */
export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  // Giả lập độ trễ phản hồi từ API backend
  await new Promise((resolve) => setTimeout(resolve, 300));
  const trimmedComment = payload.comment.trim();

  // Ràng buộc nghiệp vụ: Yêu cầu đăng nhập trước khi đánh giá
  if (!payload.userId) {
    throw new Error('Vui lòng đăng nhập để gửi đánh giá.');
  }

  // Ràng buộc nghiệp vụ: Số sao chọn từ 1 đến 5
  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error('Vui lòng chọn số sao đánh giá từ 1 đến 5.');
  }

  // Ràng buộc nghiệp vụ: Độ dài nhận xét tối thiểu 10 ký tự
  if (trimmedComment.length < 10) {
    throw new Error('Nội dung nhận xét phải có ít nhất 10 ký tự.');
  }

  // Ràng buộc nghiệp vụ: Độ dài nhận xét tối đa 1000 ký tự
  if (trimmedComment.length > 1000) {
    throw new Error('Nội dung nhận xét không được vượt quá 1000 ký tự.');
  }

  const list = getStoredReviews(payload.bookId);
  // Ràng buộc nghiệp vụ: Mỗi độc giả chỉ được đánh giá 1 lần cho mỗi cuốn sách
  const existing = list.find((r) => r.userId === payload.userId);
  if (existing) {
    throw new Error('Bạn đã đánh giá cuốn sách này rồi. Hãy sử dụng chức năng chỉnh sửa.');
  }

  const newReview: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    bookId: payload.bookId,
    userId: payload.userId,
    userFullName: payload.userFullName || 'Độc giả',
    userEmail: payload.userEmail || '',
    userAvatarUrl: payload.userAvatarUrl || null,
    rating: Math.floor(payload.rating),
    comment: trimmedComment,
    isEdited: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [newReview, ...list];
  saveStoredReviews(payload.bookId, updated);
  return newReview;
}

/**
 * Chỉnh sửa bài đánh giá đã có.
 * Đảm bảo chỉ chính tác giả bài viết mới có quyền cập nhật đánh giá.
 *
 * @param reviewId - ID bài đánh giá cần sửa
 * @param payload - Thông tin nội dung và số sao cập nhật
 * @returns Promise chứa bài đánh giá `Review` sau khi cập nhật
 */
export async function updateReview(
  reviewId: string,
  payload: UpdateReviewPayload
): Promise<Review> {
  // Giả lập độ trễ phản hồi từ API backend
  await new Promise((resolve) => setTimeout(resolve, 300));
  const trimmedComment = payload.comment.trim();

  // Ràng buộc nghiệp vụ: Yêu cầu đăng nhập trước khi chỉnh sửa
  if (!payload.userId) {
    throw new Error('Vui lòng đăng nhập để cập nhật đánh giá.');
  }

  // Ràng buộc nghiệp vụ: Số sao chọn từ 1 đến 5
  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error('Vui lòng chọn số sao đánh giá từ 1 đến 5.');
  }

  // Ràng buộc nghiệp vụ: Độ dài nhận xét tối thiểu 10 ký tự
  if (trimmedComment.length < 10) {
    throw new Error('Nội dung nhận xét phải có ít nhất 10 ký tự.');
  }

  // Ràng buộc nghiệp vụ: Độ dài nhận xét tối đa 1000 ký tự
  if (trimmedComment.length > 1000) {
    throw new Error('Nội dung nhận xét không được vượt quá 1000 ký tự.');
  }

  const list = getStoredReviews(payload.bookId);
  const idx = list.findIndex((r) => r.id === reviewId);

  if (idx === -1) {
    throw new Error('Không tìm thấy bài đánh giá cần cập nhật.');
  }

  // Ràng buộc bảo mật: Chỉ cho phép chính người dùng sở hữu review đó thực hiện sửa
  if (list[idx].userId !== payload.userId) {
    throw new Error('Bạn không có quyền chỉnh sửa bài đánh giá này.');
  }

  list[idx] = {
    ...list[idx],
    rating: Math.floor(payload.rating),
    comment: trimmedComment,
    isEdited: true,
    updatedAt: new Date().toISOString(),
  };

  saveStoredReviews(payload.bookId, list);
  return list[idx];
}

/**
 * Xóa bài đánh giá của chính người dùng.
 *
 * @param reviewId - ID bài đánh giá cần xóa
 * @param bookId - ID cuốn sách chứa bài đánh giá
 * @param userId - ID người dùng hiện tại thực hiện thao tác xóa
 * @returns Promise<boolean> - `true` nếu xóa thành công
 */
export async function deleteReview(reviewId: string, bookId: string, userId: string): Promise<boolean> {
  // Giả lập độ trễ phản hồi từ API backend
  await new Promise((resolve) => setTimeout(resolve, 300));
  const list = getStoredReviews(bookId);
  const target = list.find((r) => r.id === reviewId);

  if (!target) {
    throw new Error('Không tìm thấy bài đánh giá.');
  }

  // Ràng buộc bảo mật: Chỉ tác giả bài đánh giá mới có quyền xóa
  if (target.userId !== userId) {
    throw new Error('Bạn không có quyền xóa bài đánh giá này.');
  }

  const updated = list.filter((r) => r.id !== reviewId);
  saveStoredReviews(bookId, updated);
  return true;
}
