import { API_URL } from '../api-client';
import { Category } from '@/types/Category';
import { Book } from '@/types/Book';
import { PaginatedBookResponse } from './books';

/**
 * Lấy toàn bộ danh sách thể loại sách (có thể truyền parentId để lấy danh mục con)
 */
export async function getCategories(parentId?: string): Promise<Category[]> {
  const url = new URL(`${API_URL}/Categories`);
  if (parentId) {
    url.searchParams.append('parentId', parentId);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 1800 }, // ISR cache 30 mins
  });

  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }

  const payload = await res.json();
  const data = payload.data || payload;

  return Array.isArray(data) ? data : [];
}

/**
 * Lấy chi tiết một thể loại theo Slug hoặc ID
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  const matched = categories.find((c) => c.slug === slug || c.id === slug);
  
  if (matched) return matched;

  // Fallback to fetch by ID
  try {
    const res = await fetch(`${API_URL}/Categories/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const payload = await res.json();
    return payload.data || payload;
  } catch {
    return null;
  }
}

export interface SearchBooksByCategoryParams {
  categorySlug: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

/**
 * Lấy danh sách sách theo thể loại
 */
export async function getBooksByCategory(
  categoryIdOrSlug: string,
  page: number = 1,
  limit: number = 12,
  sortBy: string = 'newest'
): Promise<PaginatedBookResponse> {
  const url = new URL(`${API_URL}/Books`);
  url.searchParams.append('Status', 'PUBLISHED');
  url.searchParams.append('CategoryId', categoryIdOrSlug);
  url.searchParams.append('Page', page.toString());
  url.searchParams.append('Limit', limit.toString());
  if (sortBy) {
    url.searchParams.append('SortBy', sortBy);
  }

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch books for category');
  }

  const payload = await res.json();
  const data = payload.data || payload;
  const rawItems = data.items || data || [];

  const items: Book[] = rawItems.map((item: any) => ({
    id: item.id || item.bookId || '',
    title: item.title || 'Chưa có tiêu đề',
    author: item.authorNames?.join(', ') || item.author || 'Không rõ tác giả',
    coverImage: item.coverImage || item.coverImageUrl || '',
    rating: item.rating || 0,
    status: item.status || 'PUBLISHED',
    createdAt: item.createdAt,
  }));

  return {
    items,
    page: data.page || page,
    limit: data.limit || limit,
    totalItems: data.totalItems || data.totalCount || items.length,
    totalPages: data.totalPages || Math.ceil((data.totalItems || items.length) / limit) || 1,
    hasNext: data.hasNext || data.hasNextPage || false,
  };
}
