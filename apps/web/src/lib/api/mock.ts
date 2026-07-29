import { Book } from './books';

export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export interface ReadingProgress {
  bookId: string;
  book: Book;
  progressPercentage: number;
  lastReadAt: string;
  currentChapterId?: string;
  currentChapterTitle?: string;
}

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Khoa học', slug: 'khoa-hoc' },
  { id: 'c2', name: 'Tiểu thuyết', slug: 'tieu-thuyet' },
  { id: 'c3', name: 'Lịch sử', slug: 'lich-su' },
  { id: 'c4', name: 'Kinh doanh', slug: 'kinh-doanh' },
  { id: 'c5', name: 'Tâm lý học', slug: 'tam-ly-hoc' },
  { id: 'c6', name: 'Thiếu nhi', slug: 'thieu-nhi' },
  { id: 'c7', name: 'Phát triển bản thân', slug: 'phat-trien-ban-than' },
];

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

export async function getCategories(): Promise<Category[]> {
  // Simulate network delay
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_CATEGORIES), 500));
}

export async function getReadingProgress(): Promise<ReadingProgress[]> {
  // Simulate network delay
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_READING_PROGRESS), 800));
}
