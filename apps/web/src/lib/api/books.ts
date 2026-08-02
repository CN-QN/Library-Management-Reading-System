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

export interface SearchBooksParams {
  Keyword?: string;
  Page?: number;
  Limit?: number;
  CategoryId?: string;
  Language?: string;
  AccessType?: string;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}

type RawBook = {
  id?: string;
  bookId?: string;
  title?: string;
  authorNames?: string[];
  AuthorNames?: string[];
  coverImage?: string;
  coverImageUrl?: string;
  coverAssetId?: string;
  rating?: number;
  status?: string;
  createdAt?: string;
};

function normalizeRawBook(item: RawBook): Book {
  return {
    id: item.id || item.bookId || '',
    title: item.title || 'Chưa có tiêu đề',
    author: item.authorNames?.join(', ') || item.AuthorNames?.join(', ') || 'Không rõ tác giả',
    coverImage: item.coverImage || item.coverImageUrl || item.coverAssetId || '',
    rating: item.rating || 0,
    status: item.status || 'PUBLISHED',
    createdAt: item.createdAt,
  };
}

/**
 * Tìm kiếm và lọc danh sách sách (Reader Portal).
 *
 * Frontend gửi đủ query param để URL/share link ổn định. Một số param như
 * `Language`, `AccessType`, `SortBy=viewCount` đang phụ thuộc backend áp dụng thật.
 */
export async function searchBooks(params: SearchBooksParams): Promise<PaginatedBookResponse> {
  const url = new URL(`${API_URL}/Books`);

  // Reader Portal chỉ hiển thị sách đã xuất bản, nên luôn ép Status ở tầng frontend.
  url.searchParams.append('Status', 'PUBLISHED');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.append(key, value.toString());
    }
  });

  const res = await fetch(url.toString(), {
    // Kết quả search/filter cần phản ánh query URL hiện tại, không dùng cache ISR.
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to search books');
  }

  const payload = await res.json();
  const data = payload.data || payload;
  const rawItems: RawBook[] = data.items || data || [];
  const items = rawItems.map(normalizeRawBook);

  return {
    items,
    page: data.page || params.Page || 1,
    limit: data.limit || params.Limit || 12,
    totalItems: data.totalItems || data.totalCount || items.length,
    totalPages: data.totalPages || Math.ceil((data.totalItems || items.length) / (params.Limit || 12)) || 1,
    hasNext: data.hasNext || data.hasNextPage || false,
  };
}
