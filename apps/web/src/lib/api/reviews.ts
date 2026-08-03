import axios from 'axios';
import apiClient from '../api-client';
import type {
  Review,
  ReviewStats,
  GetReviewsParams,
  PaginatedReviewsResponse,
  CreateReviewPayload,
  UpdateReviewPayload,
} from '@/types/Review';

/**
 * Lấy danh sách bài đánh giá có phân trang từ Backend API.
 * Xây dựng query string gồm BookId, Page, Limit, Rating (nếu chọn lọc sao), SortBy để gửi tới `/Reviews`.
 *
 * @param params Tham số tìm kiếm và phân trang (bookId, page, limit, ratingFilter, sortBy)
 * @returns Hứa hẹn trả về PaginatedReviewsResponse chứa danh sách đánh giá
 */
export async function getReviews(params: GetReviewsParams): Promise<PaginatedReviewsResponse> {
  const { bookId, page = 1, limit = 5, ratingFilter = 'all', sortBy = 'newest' } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('BookId', bookId);
  queryParams.append('Page', page.toString());
  queryParams.append('Limit', limit.toString());
  if (ratingFilter !== 'all') {
    queryParams.append('Rating', ratingFilter.toString());
  }
  queryParams.append('SortBy', sortBy);

  try {
    const res = await apiClient.get(`/Reviews?${queryParams.toString()}`);
    return res.data.data;
  } catch (error: unknown) {
    throw new Error('Không thể tải danh sách bài đánh giá.');
  }
}

/**
 * Lấy thống kê điểm đánh giá trung bình và phân bổ 1-5 sao của một cuốn sách từ Backend API.
 * Gọi `/Reviews/stats?bookId=...`. Nếu xảy ra lỗi, trả về giá trị mặc định với số điểm và lượt đánh giá bằng 0.
 *
 * @param bookId Mã ID của cuốn sách
 * @returns Hứa hẹn trả về ReviewStats
 */
export async function getReviewStats(bookId: string): Promise<ReviewStats> {
  try {
    const res = await apiClient.get(`/Reviews/stats?bookId=${bookId}`);
    return res.data.data;
  } catch (error: unknown) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
}

/**
 * Lấy bài đánh giá cá nhân của người dùng hiện tại đối với cuốn sách từ Backend API.
 * Gọi `/Reviews/mine?bookId=...`. Nếu lỗi 404 (chưa có đánh giá), trả về null.
 *
 * @param bookId Mã ID của cuốn sách
 * @param userId Mã ID của người dùng hiện tại
 * @returns Hứa hẹn trả về Review nếu có hoặc null nếu chưa có/lỗi 404
 */
export async function getUserReview(bookId: string, userId: string): Promise<Review | null> {
  if (!userId) return null;
  try {
    const res = await apiClient.get(`/Reviews/mine?bookId=${bookId}`);
    return res.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw new Error('Không thể tải bài đánh giá cá nhân.');
  }
}

/**
 * Gửi bài đánh giá mới tới Backend API.
 * Thực hiện HTTP POST `/Reviews` với dữ liệu gồm bookId, rating, comment.
 * 
 * @param payload Dữ liệu bài đánh giá gồm bookId, rating và nội dung bình luận
 * @returns Hứa hẹn trả về đối tượng bài đánh giá Review mới được tạo
 */
export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  try {
    const res = await apiClient.post('/Reviews', { 
      bookId: payload.bookId, 
      rating: payload.rating, 
      comment: payload.comment 
    });
    return res.data.data;
  } catch (error: unknown) {
    // Trích xuất thông điệp lỗi chi tiết từ phản hồi backend API nếu có, để hiển thị lỗi chính xác cho người dùng
    const message = axios.isAxiosError(error) && error.response?.data?.message
      ? error.response.data.message
      : 'Lỗi khi gửi đánh giá.';
    throw new Error(message);
  }
}

/**
 * Chỉnh sửa bài đánh giá đã có qua Backend API.
 * Thực hiện HTTP PUT `/Reviews/${reviewId}` với rating và comment mới.
 * 
 * @param reviewId Mã ID của bài đánh giá cần cập nhật
 * @param payload Dữ liệu cập nhật gồm rating và comment mới
 * @returns Hứa hẹn trả về đối tượng bài đánh giá Review sau khi cập nhật thành công
 */
export async function updateReview(reviewId: string, payload: UpdateReviewPayload): Promise<Review> {
  try {
    const res = await apiClient.put(`/Reviews/${reviewId}`, { 
      rating: payload.rating, 
      comment: payload.comment 
    });
    return res.data.data;
  } catch (error: unknown) {
    // Xử lý bắt lỗi Axios an toàn không dùng `any` và trích xuất message từ backend API trả về
    const message = axios.isAxiosError(error) && error.response?.data?.message
      ? error.response.data.message
      : 'Lỗi khi cập nhật đánh giá.';
    throw new Error(message);
  }
}

/**
 * Xóa bài đánh giá qua Backend API.
 * Thực hiện HTTP DELETE `/Reviews/${reviewId}`. Các tham số bookId và userId giữ lại trong signature
 * để đảm bảo tương thích ngược với các caller ở UI.
 * 
 * @param reviewId Mã ID của bài đánh giá cần xóa
 * @param bookId Mã ID của cuốn sách (không gửi lên API)
 * @param userId Mã ID của người dùng (không gửi lên API)
 * @returns Hứa hẹn trả về true khi xóa thành công
 */
export async function deleteReview(reviewId: string, bookId: string, userId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/Reviews/${reviewId}`);
    return true;
  } catch (error: unknown) {
    // Trích xuất message lỗi từ backend response nếu có, fallback về thông báo lỗi tiếng Việt chuẩn
    const message = axios.isAxiosError(error) && error.response?.data?.message
      ? error.response.data.message
      : 'Lỗi khi xóa bài đánh giá.';
    throw new Error(message);
  }
}

