import { API_URL } from '../api-client';

import { Book, BookAuthorSnapshot, BookCategorySnapshot, BookPublisherSnapshot } from '@/types/Book';

/**
 * Lấy danh sách sách đang thịnh hành.
 * Sử dụng ISR cache của Next.js (60s) để tối ưu hiệu năng và cập nhật kịp thời.
 */
export async function getTrendingBooks(limit: number = 10): Promise<Book[]> {
  const res = await fetch(`${API_URL}/Books/trending?limit=${limit}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch trending books');
  const data = await res.json();
  const rawItems: RawBook[] = data.data || data;
  return Array.isArray(rawItems) ? rawItems.map(normalizeRawBook) : [];
}

/**
 * Lấy danh sách sách mới phát hành.
 * Sử dụng ISR cache của Next.js (60s).
 */
export async function getNewReleases(limit: number = 10): Promise<Book[]> {
  const res = await fetch(`${API_URL}/Books/new-releases?limit=${limit}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch new releases');
  const data = await res.json();
  const rawItems: RawBook[] = data.data || data;
  return Array.isArray(rawItems) ? rawItems.map(normalizeRawBook) : [];
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
  Availability?: string;
  AccessType?: string;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}

type RawBook = {
  id?: string;
  bookId?: string;
  slug?: string;
  Slug?: string;
  title?: string;
  authorNames?: string[];
  AuthorNames?: string[];
  authors?: BookAuthorSnapshot[];
  Authors?: BookAuthorSnapshot[];
  categories?: BookCategorySnapshot[];
  Categories?: BookCategorySnapshot[];
  publisher?: BookPublisherSnapshot | null;
  Publisher?: BookPublisherSnapshot | null;
  coverImage?: string;
  coverImageUrl?: string;
  coverAssetId?: string;
  CoverAssetId?: string;
  rating?: number;
  accessType?: string;
  AccessType?: string;
  price?: number;
  Price?: number;
  status?: string;
  createdAt?: string;
};

function normalizeRawBook(item: RawBook): Book {
  const authors: BookAuthorSnapshot[] = item.authors ?? item.Authors ?? [];
  const categories: BookCategorySnapshot[] = item.categories ?? item.Categories ?? [];
  const publisher: BookPublisherSnapshot | null = item.publisher ?? item.Publisher ?? null;
  // Derive display author string: prefer embedded, fall back to flat name arrays.
  const authorDisplay =
    authors.length > 0
      ? authors.map((a) => a.name).join(', ')
      : item.authorNames?.join(', ') || item.AuthorNames?.join(', ') || 'Không rõ tác giả';

  return {
    id: item.id || item.bookId || '',
    slug: item.slug || item.Slug,
    title: item.title || 'Chưa có tiêu đề',
    author: authorDisplay,
    authors,
    categories,
    publisher,
    coverImage: item.coverImage || item.coverImageUrl || item.coverAssetId || item.CoverAssetId || '',
    rating: item.rating || 0,
    accessType: item.accessType || item.AccessType || 'FREE',
    price: item.price ?? item.Price ?? 0,
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
  const rawItems: RawBook[] = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];
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

