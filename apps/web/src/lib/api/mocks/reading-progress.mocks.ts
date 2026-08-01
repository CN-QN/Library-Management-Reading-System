import { ReadingProgress } from '@/types/ReadingProgress';

export const MOCK_READING_PROGRESS: ReadingProgress[] = [
  {
    bookId: 'b1',
    book: {
      id: 'b1',
      title: 'Đắc Nhân Tâm',
      author: 'Dale Carnegie',
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop',
    },
    progressPercentage: 45,
    lastReadAt: new Date().toISOString(),
    currentChapterTitle: 'Chương 3: Làm sao để...?',
  },
  {
    bookId: 'b2',
    book: {
      id: 'b2',
      title: 'Sapiens - Lược sử loài người',
      author: 'Yuval Noah Harari',
      coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=400&auto=format&fit=crop',
    },
    progressPercentage: 12,
    lastReadAt: new Date(Date.now() - 86400000).toISOString(),
    currentChapterTitle: 'Chương 1: Khởi thủy',
  }
];

/**
 * Lấy tiến độ đọc sách của người dùng hiện tại (Mock data).
 * TODO(api): Thay bằng lời gọi Axios tới Backend (cần truyền Token xác thực).
 */
export async function getReadingProgress(): Promise<ReadingProgress[]> {
  // Giả lập độ trễ mạng (800ms)
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_READING_PROGRESS), 800));
}
