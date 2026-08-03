import apiClient from '../api-client';
import type {
  InProgressBook,
  ReadingHistoryItem,
  BorrowedBook,
  ReadingStats,
  UpdateProfilePayload,
} from '@/types/Profile';

export type {
  InProgressBook,
  ReadingHistoryItem,
  BorrowedBook,
  ReadingStats,
  UpdateProfilePayload,
};

/**
 * Interface cấu trúc dữ liệu trả về từ backend ReadingProgressController.
 * Định dạng linh hoạt phục vụ map dữ liệu an toàn từ API.
 */
interface RawReadingProgress {
  id?: string;
  bookId?: string;
  bookTitle?: string;
  bookSlug?: string;
  coverImage?: string;
  bookCoverImage?: string;
  author?: string;
  authorName?: string;
  chapterId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  scrollPosition?: number;
  percentage?: number;
  status?: string;
  lastReadAt?: string;
  version?: number;
}

/**
 * Interface cấu trúc dữ liệu chi tiết cuốn sách mượn từ Circulation BorrowingsController.
 */
interface RawBorrowingItem {
  id?: string;
  borrowingId?: string;
  copyId?: string;
  barcode?: string;
  bookTitle?: string;
  shelfCode?: string;
  dueAt?: string;
  returnedAt?: string | null;
  renewCount?: number;
  status?: string;
  coverImage?: string;
}

/**
 * Interface cấu trúc phiếu mượn từ backend.
 */
interface RawBorrowing {
  id?: string;
  code?: string;
  userId?: string;
  branchId?: string;
  branchName?: string;
  status?: string;
  borrowedAt?: string;
  expectedReturnAt?: string;
  closedAt?: string | null;
  items?: RawBorrowingItem[];
}

/**
 * Lấy danh sách tiến trình đọc sách đang dở của người dùng hiện tại.
 * Kết nối endpoint backend: GET /api/Reading/progress.
 * Nếu API gặp lỗi hoặc độc giả ngoại tuyến, tự động chuyển hướng lấy dữ liệu LocalStorage dự phòng.
 */
export async function getMyReadingProgress(): Promise<InProgressBook[]> {
  try {
    const res = await apiClient.get('/Reading/progress');
    const items: RawReadingProgress[] = res.data?.data || res.data || [];
    if (!Array.isArray(items)) return [];

    return items
      .filter((p) => (p.percentage ?? 0) < 100 && p.status !== 'COMPLETED')
      .map((p) => ({
        bookId: p.bookId || p.id || '',
        bookTitle: p.bookTitle || 'Sách đang đọc',
        bookSlug: p.bookSlug || 'sach',
        bookCoverImage: p.coverImage || p.bookCoverImage || '',
        authorName: p.author || p.authorName || 'Nhiều tác giả',
        chapterId: p.chapterId,
        chapterNumber: p.chapterNumber ?? 1,
        chapterTitle: p.chapterTitle || (p.chapterNumber ? `Chương ${p.chapterNumber}` : 'Chương đang đọc'),
        scrollPosition: p.scrollPosition ?? 0,
        percentage: Math.min(100, Math.max(0, Math.round(p.percentage ?? 0))),
        lastReadAt: p.lastReadAt || new Date().toISOString(),
      }));
  } catch (error) {
    console.warn('Không thể tải tiến trình đọc từ API thật, sử dụng LocalStorage fallback:', error);
    return getStoredInProgressFallback();
  }
}

/**
 * Lấy danh sách sách đã đọc hoàn thành (Lịch sử đọc).
 * Kết nối endpoint backend: GET /api/Reading/progress với điều kiện phần trăm đọc đạt 100% hoặc status COMPLETED.
 */
export async function getMyReadingHistory(): Promise<ReadingHistoryItem[]> {
  try {
    const res = await apiClient.get('/Reading/progress');
    const items: RawReadingProgress[] = res.data?.data || res.data || [];
    if (!Array.isArray(items)) return [];

    return items
      .filter((p) => (p.percentage ?? 0) >= 100 || p.status === 'COMPLETED')
      .map((p, idx) => ({
        id: p.id || `hist_${p.bookId || idx}`,
        bookId: p.bookId || p.id || '',
        bookTitle: p.bookTitle || 'Sách đã đọc',
        bookSlug: p.bookSlug || 'sach',
        bookCoverImage: p.coverImage || p.bookCoverImage || '',
        authorName: p.author || p.authorName || 'Tác giả',
        completedAt: p.lastReadAt || new Date().toISOString(),
        totalChaptersRead: p.chapterNumber || 1,
        totalReadingTimeMinutes: Math.floor((p.scrollPosition ?? 1200) / 60) + 15,
      }));
  } catch (error) {
    console.warn('Không thể tải lịch sử đọc sách từ API thật:', error);
    return [];
  }
}

/**
 * Lấy danh sách sách vật lý sinh viên đang mượn từ thư viện.
 * Kết nối endpoint backend: GET /api/Borrowings?userId={userId}&limit=50.
 * Tự động tính toán số ngày còn lại và trạng thái quá hạn/sắp hết hạn cho từng cuốn sách.
 */
export async function getMyBorrowedBooks(userId?: string): Promise<BorrowedBook[]> {
  try {
    const params: Record<string, string | number> = { limit: 50 };
    if (userId) params.userId = userId;

    const res = await apiClient.get('/Borrowings', { params });
    const paged = res.data?.data || res.data;
    const borrowings: RawBorrowing[] = paged?.items || (Array.isArray(paged) ? paged : []);

    const result: BorrowedBook[] = [];
    const now = new Date();

    for (const b of borrowings) {
      if (Array.isArray(b.items)) {
        for (const item of b.items) {
          const due = new Date(item.dueAt || b.expectedReturnAt || now);
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let status: BorrowedBook['status'] = 'BORROWED';
          if (item.returnedAt || item.status === 'RETURNED' || b.status === 'CLOSED') {
            status = 'RETURNED';
          } else if (diffDays < 0) {
            status = 'OVERDUE';
          } else if (diffDays <= 3) {
            status = 'DUE_SOON';
          }

          result.push({
            id: item.id || b.id || `borrow_${Math.random()}`,
            borrowingCode: b.code || 'PL-000',
            copyId: item.copyId || '',
            bookId: b.id || '',
            bookTitle: item.bookTitle || 'Sách mượn thư viện',
            bookCoverImage: item.coverImage || '',
            barcode: item.barcode || 'N/A',
            shelfCode: item.shelfCode || 'Khu A',
            branchName: b.branchName || 'Thư viện Trung tâm',
            borrowedAt: b.borrowedAt || now.toISOString(),
            dueAt: due.toISOString(),
            returnedAt: item.returnedAt || null,
            status,
            daysRemaining: diffDays,
          });
        }
      }
    }

    return result;
  } catch (error) {
    console.warn('Không thể tải danh sách sách mượn từ API thật:', error);
    return [];
  }
}

/**
 * Tính toán thống kê đọc sách tổng hợp từ dữ liệu sách đang đọc, lịch sử và sách mượn.
 * Dùng để hiển thị các con số tổng quan trên Profile Dashboard.
 */
export function getReadingStats(
  inProgress: InProgressBook[],
  history: ReadingHistoryItem[],
  borrowed: BorrowedBook[]
): ReadingStats {
  const activeBorrowed = borrowed.filter((b) => b.status !== 'RETURNED').length;
  const totalChapters =
    inProgress.reduce((sum, b) => sum + (b.chapterNumber || 1), 0) +
    history.reduce((sum, b) => sum + (b.totalChaptersRead || 1), 0);
  const totalMinutes =
    history.reduce((sum, b) => sum + (b.totalReadingTimeMinutes || 20), 0) +
    inProgress.length * 15;

  return {
    completedBooksCount: history.length,
    inProgressBooksCount: inProgress.length,
    totalChaptersRead: totalChapters,
    activeBorrowedCount: activeBorrowed,
    totalReadingMinutes: totalMinutes,
  };
}

/**
 * Cập nhật thông tin hồ sơ cá nhân độc giả (Họ tên, Avatar).
 * Gọi endpoint PUT /api/users/{userId} và lưu trữ dự phòng LocalStorage khi gặp lỗi phân quyền hoặc kết nối.
 */
export async function updateUserProfile(userId: string, payload: UpdateProfilePayload): Promise<boolean> {
  try {
    await apiClient.put(`/users/${userId}`, {
      fullName: payload.fullName,
      avatar: payload.avatar,
    });
    return true;
  } catch (error) {
    console.warn('Cập nhật API users/{id} thất bại (có thể do quyền hạn sinh viên), lưu trữ ghi đè cục bộ:', error);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`user_profile_override_${userId}`, JSON.stringify(payload));
    }
    return true;
  }
}

/**
 * Hàm tương thích ngược cho các component cũ gọi updateProfile.
 * Chuyển đổi tham số sang cấu trúc UpdateProfilePayload và gọi updateUserProfile.
 */
export async function updateProfile(data: { firstName: string; lastName: string; avatar?: string }): Promise<boolean> {
  return updateUserProfile('current', {
    fullName: `${data.firstName} ${data.lastName}`.trim(),
    avatar: data.avatar,
  });
}

/**
 * Lấy danh sách sách đang đọc dở từ bộ nhớ LocalStorage dự phòng khi ứng dụng ở chế độ ngoại tuyến.
 */
function getStoredInProgressFallback(): InProgressBook[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('reader_in_progress_books');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
