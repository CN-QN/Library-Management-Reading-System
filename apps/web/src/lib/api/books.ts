import { API_URL } from '../api-client';

import { Book } from '@/types/Book';

/**
 * Lấy danh sách sách đang thịnh hành.
 * Sử dụng ISR cache của Next.js (3600s) để giảm tải cho DB vì danh sách này ít thay đổi liên tục.
 */
export async function getTrendingBooks(limit: number = 10): Promise<Book[]> {
  const res = await fetch(`${API_URL}/Books/trending?limit=${limit}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error('Failed to fetch trending books');
  const data = await res.json();
  // Xử lý unwrap data: API trả về { data: [...] } hoặc trực tiếp [...] tuỳ phiên bản backend
  return data.data || data;
}

/**
 * Lấy danh sách sách mới phát hành.
 * Sử dụng ISR cache (3600s) tương tự mục thịnh hành.
 */
export async function getNewReleases(limit: number = 10): Promise<Book[]> {
  const res = await fetch(`${API_URL}/Books/new-releases?limit=${limit}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error('Failed to fetch new releases');
  const data = await res.json();
  return data.data || data;
}
