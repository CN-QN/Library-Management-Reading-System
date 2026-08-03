/**
 * Chi tiết thông tin sách dành riêng cho trang Reader Portal Book Detail.
 */
export interface BookDetail {
  /** Định danh duy nhất của sách (GUID) */
  id: string;
  /** Chuỗi định danh URL thân thiện (vd: "co-gai-den-tu-hom-qua") */
  slug: string;
  /** Tên sách */
  title: string;
  /** Tóm tắt / mô tả nội dung sách, null nếu chưa có */
  summary: string | null;
  /** Tên nhà xuất bản, null nếu không có */
  publisherName: string | null;
  /** Năm xuất bản, null nếu không có */
  publicationYear: number | null;
  /** Mã số chuẩn quốc tế cho sách (ISBN), null nếu không có */
  isbn: string | null;
  /** Ngôn ngữ hiển thị (vd: "vi", "en"), null nếu không có */
  language: string | null;
  /** Loại truy cập (vd: "Free", "Premium", "MemberOnly") */
  accessType: string;
  /** Trạng thái của sách (vd: "Published", "Draft") */
  status: string;
  /** Tổng số chương sách hiện có */
  totalChapters: number;
  /** Lượt xem chi tiết của sách */
  viewCount: number;
  /** Điểm đánh giá trung bình (1-5) */
  rating: number;
  /** Danh sách tên tác giả */
  authorNames: string[];
  /** Danh sách tên thể loại */
  categoryNames: string[];
  /** Danh sách ID thể loại */
  categoryIds: string[];
  /** Danh sách ID tác giả */
  authorIds: string[];
}

/**
 * Thông tin tóm tắt của một chương sách.
 */
export interface ChapterSummary {
  /** ID chương sách */
  id: string;
  /** ID sách sở hữu chương này */
  bookId: string;
  /** Tiêu đề chương */
  title: string;
  /** Thứ tự chương (1-indexed) */
  number: number;
  /** Tóm tắt ngắn nội dung chương, null nếu không có */
  summary: string | null;
  /** Trạng thái xuất bản chương */
  status: string;
  /** Số lượng từ trong chương */
  wordCount: number;
  /** Thời gian đọc ước tính (phút) */
  readingTime: number;
}

/**
 * Thông tin tiến độ đọc sách của người dùng hiện tại đối với một cuốn sách.
 */
export interface ReadingProgressDetail {
  /** ID của chương đang đọc gần nhất */
  chapterId: string;
  /** Thứ tự chương đang đọc gần nhất */
  chapterNumber: number;
  /** Vị trí cuộn trang trong reader (pixels) */
  scrollPosition: number;
  /** Phần trăm hoàn thành cuốn sách (0-100) */
  percentage: number;
  /** Trạng thái tiến độ (vd: "Reading", "Completed") */
  status: string;
  /** Phiên bản dữ liệu tiến độ */
  version: number;
  /** Thời gian đọc gần nhất (ISO 8601 string, UTC) */
  lastReadAt: string;
}

/**
 * Thông tin tóm tắt sách phục vụ danh sách gợi ý cho bạn.
 */
export interface BookRecommendation {
  /** ID sách */
  id: string;
  /** Slug của sách */
  slug: string;
  /** Tên sách */
  title: string;
  /** Tóm tắt ngắn */
  summary: string | null;
  /** Điểm đánh giá (1-5) */
  rating: number;
  /** Trạng thái xuất bản */
  status: string;
  /** Năm xuất bản */
  publicationYear: number | null;
  /** Tên tác giả */
  authorNames: string[];
  /** Tên thể loại */
  categoryNames: string[];
  /** URL ảnh bìa (nếu có) */
  coverImage?: string;
}

/**
 * Thông tin tệp tin sách (ảnh bìa, PDF, EPUB).
 */
export interface BookFile {
  /** URL tuyệt đối hoặc tương đối để truy cập tệp */
  fileUrl: string;
  /** Loại tệp (vd: "Cover", "PDF", "EPUB") */
  fileType: string;
  /** Tên tệp gốc */
  fileName: string;
}
