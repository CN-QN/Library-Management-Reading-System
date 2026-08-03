import apiClient, { API_URL } from '../api-client';
import type {
  Review,
  ReviewStats,
  GetReviewsParams,
  PaginatedReviewsResponse,
  CreateReviewPayload,
  UpdateReviewPayload,
} from '@/types/Review';

/**
 * Lấy danh sách bài đánh giá của một cuốn sách từ Backend API real.
 */
export async function getReviews(params: GetReviewsParams): Promise<PaginatedReviewsResponse> {
  const { bookId, page = 1, limit = 5, ratingFilter = 'all', sortBy = 'newest' } = params;

  try {
    const urlParams = new URLSearchParams({
      bookId,
      page: page.toString(),
      pageSize: limit.toString(),
      sortBy,
    });

    if (ratingFilter !== 'all') {
      urlParams.append('ratingFilter', ratingFilter.toString());
    }

    const res = await apiClient.get(`/Reviews?${urlParams.toString()}`);
    const payload = res.data.data || res.data;

    const items: Review[] = (payload.items || payload || []).map((item: any) => ({
      id: item.id,
      bookId: item.bookId,
      userId: item.userId,
      userFullName: item.userFullName || 'Độc giả',
      userEmail: item.userEmail || '',
      userAvatarUrl: item.userAvatarUrl || null,
      rating: item.rating,
      comment: item.comment,
      isEdited: item.isEdited || false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      items,
      page: payload.page || page,
      limit: payload.limit || limit,
      totalItems: payload.totalItems || payload.totalCount || items.length,
      totalPages: payload.totalPages || Math.ceil((payload.totalItems || items.length) / limit) || 1,
    };
  } catch (error) {
    console.warn('Error fetching reviews from backend:', error);
    return {
      items: [],
      page: 1,
      limit,
      totalItems: 0,
      totalPages: 1,
    };
  }
}

/**
 * Lấy thống kê điểm trung bình và phân bổ 1-5 sao của sách từ Backend API real.
 */
export async function getReviewStats(bookId: string): Promise<ReviewStats> {
  try {
    const res = await apiClient.get(`/Reviews/stats?bookId=${encodeURIComponent(bookId)}`);
    const data = res.data.data || res.data;

    return {
      averageRating: data.averageRating || 0,
      totalReviews: data.totalReviews || 0,
      distribution: data.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      percentages: data.percentages || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  } catch (error) {
    console.warn('Error fetching review stats:', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
}

/**
 * Lấy bài đánh giá của người dùng hiện tại đối với cuốn sách.
 */
export async function getUserReview(bookId: string, userId: string): Promise<Review | null> {
  if (!userId) return null;
  try {
    const res = await apiClient.get(`/Reviews/mine?bookId=${encodeURIComponent(bookId)}`);
    const item = res.data.data || res.data;
    if (!item) return null;

    return {
      id: item.id,
      bookId: item.bookId,
      userId: item.userId,
      userFullName: item.userFullName || 'Độc giả',
      userEmail: item.userEmail || '',
      userAvatarUrl: item.userAvatarUrl || null,
      rating: item.rating,
      comment: item.comment,
      isEdited: item.isEdited || false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Gửi bài đánh giá mới tới Backend API real.
 */
export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  const trimmedComment = payload.comment.trim();

  if (!payload.userId) {
    throw new Error('Vui lòng đăng nhập để gửi đánh giá.');
  }

  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error('Vui lòng chọn số sao đánh giá từ 1 đến 5.');
  }

  if (trimmedComment.length < 10) {
    throw new Error('Nội dung nhận xét phải có ít nhất 10 ký tự.');
  }

  if (trimmedComment.length > 1000) {
    throw new Error('Nội dung nhận xét không được vượt quá 1000 ký tự.');
  }

  try {
    const res = await apiClient.post('/Reviews', {
      bookId: payload.bookId,
      rating: payload.rating,
      comment: trimmedComment,
    });

    const item = res.data.data || res.data;
    return {
      id: item.id,
      bookId: item.bookId,
      userId: item.userId,
      userFullName: item.userFullName || payload.userFullName || 'Độc giả',
      userEmail: item.userEmail || payload.userEmail || '',
      userAvatarUrl: item.userAvatarUrl || payload.userAvatarUrl || null,
      rating: item.rating,
      comment: item.comment,
      isEdited: false,
      createdAt: item.createdAt,
    };
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.';
    throw new Error(msg);
  }
}

/**
 * Chỉnh sửa bài đánh giá đã có.
 */
export async function updateReview(
  reviewId: string,
  payload: UpdateReviewPayload
): Promise<Review> {
  const trimmedComment = payload.comment.trim();

  if (!payload.userId) {
    throw new Error('Vui lòng đăng nhập để cập nhật đánh giá.');
  }

  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error('Vui lòng chọn số sao đánh giá từ 1 đến 5.');
  }

  if (trimmedComment.length < 10) {
    throw new Error('Nội dung nhận xét phải có ít nhất 10 ký tự.');
  }

  try {
    const res = await apiClient.put(`/Reviews/${reviewId}`, {
      rating: payload.rating,
      comment: trimmedComment,
    });

    const item = res.data.data || res.data;
    return {
      id: item.id,
      bookId: item.bookId,
      userId: item.userId,
      userFullName: item.userFullName || 'Độc giả',
      userEmail: item.userEmail || '',
      userAvatarUrl: item.userAvatarUrl || null,
      rating: item.rating,
      comment: item.comment,
      isEdited: true,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Không thể cập nhật đánh giá.';
    throw new Error(msg);
  }
}

/**
 * Xóa bài đánh giá.
 */
export async function deleteReview(reviewId: string, bookId: string, userId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/Reviews/${reviewId}`);
    return true;
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Không thể xóa bài đánh giá.';
    throw new Error(msg);
  }
}
