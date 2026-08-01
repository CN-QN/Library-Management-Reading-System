import { Category } from '@/types/Category';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Khoa học', slug: 'khoa-hoc' },
  { id: 'c2', name: 'Tiểu thuyết', slug: 'tieu-thuyet' },
  { id: 'c3', name: 'Lịch sử', slug: 'lich-su' },
  { id: 'c4', name: 'Kinh doanh', slug: 'kinh-doanh' },
  { id: 'c5', name: 'Tâm lý học', slug: 'tam-ly-hoc' },
  { id: 'c6', name: 'Thiếu nhi', slug: 'thieu-nhi' },
  { id: 'c7', name: 'Phát triển bản thân', slug: 'phat-trien-ban-than' },
];

/**
 * Lấy danh sách thể loại (Mock data).
 * TODO(api): Thay bằng lời gọi Axios tới Backend khi API Categories sẵn sàng.
 */
export async function getCategories(): Promise<Category[]> {
  // Giả lập độ trễ mạng (500ms) để kiểm thử Skeleton fallback của Suspense
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_CATEGORIES), 500));
}
