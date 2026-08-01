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

export interface PaginatedBookResponse {
  items: Book[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

/**
 * Tìm kiếm và lọc danh sách sách (Reader Portal).
 * API trả về danh sách phân trang.
 */
export async function searchBooks(params: {
  Keyword?: string;
  Page?: number;
  Limit?: number;
}): Promise<PaginatedBookResponse> {
  const url = new URL(`${API_URL}/Books`);
  
  // Implicit rule: Only show published books in Reader Portal
  url.searchParams.append('Status', 'PUBLISHED');
  
  if (params.Keyword) {
    url.searchParams.append('Keyword', params.Keyword);
  }
  
  url.searchParams.append('Page', (params.Page || 1).toString());
  url.searchParams.append('Limit', (params.Limit || 12).toString());

  // Removed SortBy and SortOrder as they are deferred and currently ignored by backend

  const res = await fetch(url.toString(), {
    // Disable cache for search results to ensure freshness, or use a short revalidate
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to search books');
  }

  const payload = await res.json();
  const data = payload.data || payload;
  const rawItems = data.items || data || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Book[] = rawItems.map((item: any) => ({
    id: item.id || item.bookId,
    title: item.title,
    author: item.authorNames?.join(', ') || item.AuthorNames?.join(', ') || 'Không rõ tác giả',
    coverImage: item.coverImage || item.coverImageUrl || '',
    rating: item.rating || 0,
    status: item.status || 'PUBLISHED',
    createdAt: item.createdAt,
  }));

  return {
    items,
    page: data.page || params.Page || 1,
    limit: data.limit || params.Limit || 12,
    totalItems: data.totalItems || data.totalCount || items.length,
    totalPages: data.totalPages || Math.ceil((data.totalItems || items.length) / (params.Limit || 12)) || 1,
    hasNext: data.hasNext || data.hasNextPage || false,
  };
}
