import { API_URL } from '../api-client';
import { Book, BookCategorySnapshot } from '@/types/Book';
import { PaginatedBookResponse } from './books';

/**
 * Lấy danh sách sách theo thể loại.
 *
 * Category browsing now goes through the /Books endpoint with CategoryId filter
 * and extracts category metadata from `Book.categories[].slug` — NOT from
 * the removed standalone /api/categories endpoint.
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

  const items: Book[] = rawItems.map((item: Record<string, unknown>) => {
    const authors = Array.isArray(item['authors']) ? item['authors'] : [];
    const categories = Array.isArray(item['categories']) ? item['categories'] : [];
    const publisher = typeof item['publisher'] === 'object' ? item['publisher'] : null;
    const authorDisplay =
      authors.length > 0
        ? authors.map((a: { name?: string }) => a.name ?? '').join(', ')
        : (Array.isArray(item['authorNames']) ? (item['authorNames'] as string[]).join(', ') : '') ||
          'Không rõ tác giả';

    return {
      id: (item['id'] as string) || (item['bookId'] as string) || '',
      slug: (item['slug'] as string) || undefined,
      title: (item['title'] as string) || 'Chưa có tiêu đề',
      author: authorDisplay,
      authors,
      categories,
      publisher,
      coverImage: (item['coverImage'] as string) || (item['coverImageUrl'] as string) || '',
      rating: (item['rating'] as number) || 0,
      accessType: (item['accessType'] as string) || 'FREE',
      price: (item['price'] as number) || 0,
      status: (item['status'] as string) || 'PUBLISHED',
      createdAt: item['createdAt'] as string | undefined,
    };
  });

  return {
    items,
    page: data.page || page,
    limit: data.limit || limit,
    totalItems: data.totalItems || data.totalCount || items.length,
    totalPages: data.totalPages || Math.ceil((data.totalItems || items.length) / limit) || 1,
    hasNext: data.hasNext || data.hasNextPage || false,
  };
}

/**
 * Derive unique categories from a list of books using the embedded
 * `Book.categories[].slug` field — does NOT call /api/categories.
 */
export function deriveCategoriesFromBooks(books: Book[]): BookCategorySnapshot[] {
  const seen = new Set<string>();
  const result: BookCategorySnapshot[] = [];
  for (const book of books) {
    for (const cat of book.categories ?? []) {
      if (cat.slug && !seen.has(cat.slug)) {
        seen.add(cat.slug);
        result.push(cat);
      }
    }
  }
  return result;
}

export interface SearchBooksByCategoryParams {
  categorySlug: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}
