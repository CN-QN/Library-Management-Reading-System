import apiClient, { API_URL } from '../api-client';
import { Book } from '@/types/Book';

export interface InProgressBook {
  bookId: string;
  book: Book;
  chapterId?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  scrollPosition?: number;
  progressPercentage: number;
  lastReadAt: string;
}

export interface ReadingHistoryItem {
  id: string;
  bookId: string;
  book: Book;
  completedAt: string;
  totalChaptersRead: number;
}

export interface BorrowedBook {
  id: string;
  copyId: string;
  bookId: string;
  bookTitle: string;
  coverImage?: string;
  barcode: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
  status: 'ACTIVE' | 'OVERDUE' | 'RETURNED';
}

/**
 * Lấy danh sách tiến trình đọc sách đang dở của người dùng hiện tại
 */
export async function getMyReadingProgress(): Promise<InProgressBook[]> {
  try {
    const res = await apiClient.get('/ReadingProgress');
    const data = res.data.data || res.data;
    
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      bookId: item.bookId || item.book?.id || '',
      book: {
        id: item.bookId || item.book?.id || '',
        title: item.bookTitle || item.book?.title || 'Đang cập nhật',
        author: item.author || item.book?.author || 'Tác giả',
        coverImage: item.coverImage || item.book?.coverImage || '',
        rating: item.book?.rating || 0,
        status: item.book?.status || 'PUBLISHED',
      },
      chapterId: item.chapterId,
      chapterTitle: item.chapterTitle || (item.chapterNumber ? `Chương ${item.chapterNumber}` : undefined),
      chapterNumber: item.chapterNumber,
      scrollPosition: item.scrollPosition || 0,
      progressPercentage: item.progressPercentage || item.percentage || 0,
      lastReadAt: item.lastReadAt || item.updatedAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('Could not fetch reading progress from API, returning empty list:', error);
    return [];
  }
}

/**
 * Lấy lịch sử đọc sách cá nhân (Sách đã hoàn thành / Lịch sử phiên đọc)
 */
export async function getMyReadingHistory(): Promise<ReadingHistoryItem[]> {
  try {
    const res = await apiClient.get('/ReadingProgress/history');
    const data = res.data.data || res.data;
    
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.id || item.bookId,
      bookId: item.bookId,
      book: {
        id: item.bookId,
        title: item.bookTitle || item.title || 'Sách đã đọc',
        author: item.author || 'Tác giả',
        coverImage: item.coverImage || '',
        rating: 5,
        status: 'PUBLISHED',
      },
      completedAt: item.completedAt || item.lastReadAt || new Date().toISOString(),
      totalChaptersRead: item.totalChaptersRead || 1,
    }));
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách sách vật lý sinh viên đang mượn từ thư viện
 */
export async function getMyBorrowedBooks(): Promise<BorrowedBook[]> {
  try {
    const res = await apiClient.get('/Borrowings/my-loans');
    const data = res.data.data || res.data;

    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.id,
      copyId: item.copyId || '',
      bookId: item.bookId || '',
      bookTitle: item.bookTitle || item.title || 'Sách mượn',
      coverImage: item.coverImage || '',
      barcode: item.barcode || 'N/A',
      borrowedAt: item.borrowedAt,
      dueAt: item.dueAt,
      returnedAt: item.returnedAt,
      status: item.status || (new Date(item.dueAt) < new Date() ? 'OVERDUE' : 'ACTIVE'),
    }));
  } catch {
    return [];
  }
}

/**
 * Cập nhật thông tin hồ sơ cá nhân
 */
export async function updateProfile(data: { firstName: string; lastName: string; avatar?: string }) {
  const res = await apiClient.put('/Users/profile', data);
  return res.data.data || res.data;
}
