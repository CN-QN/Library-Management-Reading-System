
/**
 * Các loại tab điều hướng trên trang hồ sơ cá nhân độc giả.
 */
export type ProfileTabType = 'reading' | 'history' | 'borrowed';

/**
 * Thông tin cuốn sách đang đọc dở của độc giả phục vụ hiển thị thanh tiến độ và nút Đọc tiếp.
 */
export interface InProgressBook {
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  bookCoverImage?: string;
  authorName?: string;
  chapterId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  scrollPosition: number;
  /** Tỷ lệ phần trăm tiến độ đọc sách từ 0 đến 100 */
  percentage: number;
  /** Chuỗi thời gian đọc gần nhất định dạng ISO 8601 */
  lastReadAt: string;
}

/**
 * Bản ghi lịch sử đọc của cuốn sách đã hoàn thành (100% hoặc status = COMPLETED).
 */
export interface ReadingHistoryItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  bookCoverImage?: string;
  authorName?: string;
  /** Chuỗi thời gian hoàn thành cuốn sách ISO 8601 */
  completedAt: string;
  /** Tổng số chương đã đọc trong cuốn sách */
  totalChaptersRead: number;
  /** Thời gian ước tính đã dành cho cuốn sách tính theo phút */
  totalReadingTimeMinutes?: number;
}

/**
 * Trạng thái mượn sách vật lý tại quầy thư viện.
 * - BORROWED: Đang trong thời hạn mượn an toàn.
 * - DUE_SOON: Sắp đến hạn trả sách (còn <= 3 ngày).
 * - OVERDUE: Đã quá hạn trả sách quy định.
 * - RETURNED: Đã hoàn trả sách về thư viện.
 */
export type BorrowStatus = 'BORROWED' | 'DUE_SOON' | 'OVERDUE' | 'RETURNED';

/**
 * Thông tin chi tiết một ấn bản sách vật lý sinh viên đang mượn từ thư viện.
 */
export interface BorrowedBook {
  id: string;
  borrowingCode: string;
  copyId: string;
  bookId: string;
  bookTitle: string;
  bookCoverImage?: string;
  barcode: string;
  shelfCode?: string;
  branchName?: string;
  /** Thời điểm bắt đầu mượn ISO 8601 */
  borrowedAt: string;
  /** Hạn chót phải trả sách ISO 8601 */
  dueAt: string;
  /** Thời điểm thực tế đã trả sách (nếu có) */
  returnedAt?: string | null;
  /** Trạng thái mượn sách */
  status: BorrowStatus;
  /** Số ngày còn lại trước khi đến hạn (hoặc số ngày âm nếu đã quá hạn) */
  daysRemaining: number;
}

/**
 * Thống kê tổng quan hoạt động đọc sách và mượn sách của độc giả.
 */
export interface ReadingStats {
  /** Số lượng sách đã hoàn thành 100% */
  completedBooksCount: number;
  /** Số lượng sách đang đọc dở */
  inProgressBooksCount: number;
  /** Tổng số chương sách đã đọc */
  totalChaptersRead: number;
  /** Số lượng sách vật lý đang mượn còn hiệu lực */
  activeBorrowedCount: number;
  /** Tổng thời gian đọc sách tính bằng phút */
  totalReadingMinutes: number;
}

/**
 * Dữ liệu payload gửi lên khi cập nhật thông tin hồ sơ cá nhân độc giả.
 */
export interface UpdateProfilePayload {
  /** Họ và tên hiển thị mới của người dùng (2-100 ký tự) */
  fullName: string;
  /** Đường dẫn URL ảnh đại diện mới */
  avatar?: string | null;
}
