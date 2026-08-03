/**
 * Mock API lưu vết Đánh dấu Yêu thích (Bookmark) trong localStorage trình duyệt.
 * Phục vụ trải nghiệm tạm thời cho Reader Portal trước khi Backend có API chính thức.
 */

const STORAGE_PREFIX = 'reader_bookmark_';

/**
 * Kiểm tra xem người dùng đã đánh dấu cuốn sách hay chưa.
 */
export function getBookmarked(userId: string | null, bookId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const key = `${STORAGE_PREFIX}${userId || 'anonymous'}_${bookId}`;
    const value = localStorage.getItem(key);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Bật/tắt trạng thái đánh dấu yêu thích cuốn sách.
 * Trả về trạng thái mới sau khi toggle.
 */
export function toggleBookmarked(userId: string | null, bookId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const key = `${STORAGE_PREFIX}${userId || 'anonymous'}_${bookId}`;
    const current = localStorage.getItem(key) === 'true';
    const nextState = !current;
    localStorage.setItem(key, String(nextState));
    return nextState;
  } catch {
    return false;
  }
}
