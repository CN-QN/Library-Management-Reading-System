/**
 * Chủ đề màu nền hiển thị cho trang đọc sách.
 * Bao gồm các chế độ: sáng (light), nâu vàng đọc ban đêm (sepia), và tối (dark).
 */
export type ReaderTheme = 'light' | 'sepia' | 'dark';

/**
 * Mức cỡ chữ tùy biến cho trang đọc sách.
 * Từ nhỏ (sm) đến rất lớn (2xl) giúp người đọc tùy chỉnh phù hợp với thị lực.
 */
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl';

/**
 * Mức giãn dòng tùy biến cho nội dung đọc sách.
 * - 'normal': Giãn dòng chật / tiêu chuẩn (1.5)
 * - 'relaxed': Giãn dòng vừa / thoáng (1.8)
 * - 'loose': Giãn dòng rộng / thưa (2.2)
 */
export type ReaderLineHeight = 'normal' | 'relaxed' | 'loose';

/**
 * Cấu hình giao diện đọc sách người dùng tùy biến.
 * Được lưu tại localStorage client để khôi phục trạng thái đọc cá nhân.
 */
export interface ReaderSettings {
  /** Chủ đề màu nền đọc sách (sáng, sepia, tối) */
  theme: ReaderTheme;
  /** Cỡ chữ hiển thị nội dung */
  fontSize: ReaderFontSize;
  /** Khoảng cách giữa các dòng văn bản */
  lineHeight: ReaderLineHeight;
}

/**
 * Thông tin tóm tắt của một chương sách phục vụ hiển thị mục lục (Table of Contents).
 */
export interface Chapter {
  /** ID duy nhất của chương */
  id: string;
  /** Tiêu đề chương sách */
  title: string;
  /** Số thứ tự chương */
  number: number;
  /** Thời gian đọc ước tính tính bằng phút (tùy chọn) */
  readingTime?: number;
  /** Số từ trong chương (tùy chọn) */
  wordCount?: number;
}

/**
 * Đoạn văn trong nội dung chương sách.
 */
export interface ChapterParagraph {
  /** Định danh duy nhất của đoạn văn (nếu có) */
  id?: string;
  /** Nội dung văn bản của đoạn văn */
  text: string;
  /** Thứ tự sắp xếp đoạn văn trong chương (bắt đầu từ 1) */
  order: number;
}

/**
 * Cấu trúc nội dung chi tiết của một chương sách.
 * Bao gồm các đoạn văn bản chính cùng phần mở đầu/kết thúc nếu có.
 */
export interface ChapterContentDetail {
  /** Lời tựa / dẫn nhập chương (nếu có) */
  introduction?: string | null;
  /** Danh sách các đoạn văn trong chương */
  paragraphs: ChapterParagraph[];
  /** Lời kết / ghi chú cuối chương (nếu có) */
  conclusion?: string | null;
}

/**
 * Dữ liệu chương sách đầy đủ gồm thông tin metadata và nội dung chi tiết.
 * Dùng để hiển thị trong chế độ đọc sách (Reader Interface).
 */
export interface FullChapterDetail {
  /** ID duy nhất của chương */
  id: string;
  /** ID của cuốn sách chứa chương này */
  bookId: string;
  /** Tiêu đề của chương */
  title: string;
  /** Số thứ tự chương */
  number: number;
  /** Tóm tắt nội dung chương (nếu có) */
  summary?: string | null;
  /** Trạng thái chương (ví dụ: PUBLISHED, DRAFT) */
  status: string;
  /** Tổng số từ trong chương */
  wordCount: number;
  /** Thời gian đọc ước tính tính bằng phút */
  readingTime: number;
  /** Cấu trúc nội dung chi tiết gồm các đoạn văn */
  content: ChapterContentDetail;
}

/**
 * Dữ liệu tiến độ đọc sách của người dùng đối với một cuốn sách.
 * Lưu trữ chương đang đọc, vị trí cuộn trang và phần trăm hoàn thành.
 */
export interface ReadingProgress {
  /** ID cuốn sách */
  bookId: string;
  /** ID chương đang đọc */
  chapterId: string;
  /** Số thứ tự chương đang đọc */
  chapterNumber: number;
  /** Vị trí cuộn trang (tính bằng pixel vertical scroll offset) */
  scrollPosition: number;
  /** Phần trăm hoàn thành cuốn sách (0 - 100) */
  percentage: number;
  /** Phiên bản dữ liệu tiến độ (dùng để giải quyết xung đột đồng bộ) */
  version: number;
  /** Trạng thái đọc (ví dụ: Reading, Completed) */
  status: string;
  /** Thời điểm đọc gần nhất (định dạng ISO 8601 string) */
  lastReadAt?: string;
}

/**
 * Dữ liệu gửi lên khi lưu tiến độ đọc sách lên Backend API.
 */
export interface SaveReadingProgressPayload {
  /** ID cuốn sách */
  bookId: string;
  /** ID chương đang đọc */
  chapterId: string;
  /** Số thứ tự chương đang đọc */
  chapterNumber: number;
  /** Vị trí cuộn trang (pixel) */
  scrollPosition: number;
  /** Phần trăm hoàn thành (0 - 100) */
  percentage: number;
  /** Phiên bản dữ liệu tiến độ (tùy chọn, mặc định 1) */
  version?: number;
  /** Trạng thái đọc (tùy chọn) */
  status?: string;
}

/**
 * Thông tin phiên đọc sách (Reading Session).
 * Dùng để theo dõi thời gian và tương tác đọc sách thực tế của người dùng.
 */
export interface ReadingSession {
  /** ID phiên đọc duy nhất */
  sessionId: string;
  /** ID cuốn sách */
  bookId: string;
  /** ID chương đang đọc */
  chapterId: string;
  /** Thời điểm bắt đầu phiên đọc (chuỗi ISO 8601) */
  startedAt: string;
}
