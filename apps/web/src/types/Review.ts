/**
 * Dữ liệu bài đánh giá cuốn sách từ độc giả.
 * Dùng để quản lý thông tin đánh giá, nhận xét, người gửi và thời gian tạo/chỉnh sửa.
 */
export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  /** URL ảnh đại diện của độc giả (null hoặc undefined nếu dùng avatar mặc định) */
  userAvatarUrl?: string | null;
  /** Điểm đánh giá từ 1 đến 5 sao */
  rating: number;
  /** Nội dung nhận xét chi tiết (tối thiểu 10 ký tự, tối đa 1000 ký tự) */
  comment: string;
  /** Đánh dấu bài đánh giá đã từng qua chỉnh sửa */
  isEdited: boolean;
  /** Chuỗi thời gian tạo ISO 8601 */
  createdAt: string;
  /** Chuỗi thời gian cập nhật gần nhất ISO 8601 */
  updatedAt?: string | null;
}

/**
 * Thống kê điểm và phân bổ số sao đánh giá của một cuốn sách.
 * Dùng hiển thị bảng tổng quan xếp hạng và thanh phần trăm điểm số trên UI.
 */
export interface ReviewStats {
  /** Điểm trung bình (làm tròn 1 chữ số thập phân, vd: 4.8) */
  averageRating: number;
  /** Tổng số lượt đánh giá */
  totalReviews: number;
  /** Số lượng bài đánh giá theo từng mức sao: 5, 4, 3, 2, 1 */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  /** Tỷ lệ phần trăm theo từng mức sao (0 - 100%) phục vụ thanh tiến trình UI */
  percentages: Record<1 | 2 | 3 | 4 | 5, number>;
}

/**
 * Tham số truy vấn danh sách đánh giá có lọc và phân trang.
 * Phục vụ API request khi chuyển trang, lọc số sao hoặc thay đổi tiêu chí sắp xếp.
 */
export interface GetReviewsParams {
  bookId: string;
  page?: number;
  limit?: number;
  ratingFilter?: 1 | 2 | 3 | 4 | 5 | 'all';
  sortBy?: 'newest' | 'highest' | 'lowest';
}

/**
 * Kết quả phân trang danh sách đánh giá từ API backend.
 * Chứa thông tin tổng số bản ghi và số trang để phục vụ tính toán ở client component.
 */
export interface PaginatedReviewsResponse {
  items: Review[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Dữ liệu gửi lên khi tạo bài đánh giá mới.
 * Chứa thông tin người dùng, cuốn sách, mức rating và nội dung bình luận.
 */
export interface CreateReviewPayload {
  bookId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  rating: number;
  comment: string;
}

/**
 * Dữ liệu gửi lên khi cập nhật bài đánh giá.
 * Cho phép độc giả cập nhật điểm rating và nội dung bình luận đã viết.
 */
export interface UpdateReviewPayload {
  bookId: string;
  userId: string;
  rating: number;
  comment: string;
}
