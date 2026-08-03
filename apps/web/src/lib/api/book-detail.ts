import { cache } from 'react';
import { cookies } from 'next/headers';
import { API_URL } from '../api-client';
import type {
  BookDetail,
  ChapterSummary,
  ReadingProgressDetail,
  BookRecommendation,
  BookFile,
} from '@/types/BookDetail';

/**
 * Custom Error class đại diện cho trường hợp không tìm thấy sách (404).
 */
export class BookNotFoundError extends Error {
  constructor(slug: string) {
    super(`Sách với slug "${slug}" không tồn tại.`);
    this.name = 'BookNotFoundError';
  }
}

/**
 * Chuẩn hóa URL tệp tin (ảnh bìa, PDF, EPUB).
 * Nếu URL là relative path (bắt đầu bằng /), tự động ghép với origin của API_URL để tạo URL tuyệt đối.
 */
function normalizeFileUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    try {
      const apiOrigin = new URL(API_URL).origin;
      return `${apiOrigin}${url}`;
    } catch {
      return url;
    }
  }
  return url;
}

/** Unwrap envelope { data: T } của backend. */
function unwrapPayload<T>(payload: T | { data: T } | null | undefined): T | null {
  if (payload === null || typeof payload === 'undefined') return null;
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data ?? null;
  }
  return payload as T;
}

/** Unwrap envelope chứa mảng list; không phải mảng thì trả []. */
function unwrapArray<T = unknown>(payload: unknown): T[] {
  const raw = unwrapPayload<T[]>(payload as T[] | { data: T[] });
  return Array.isArray(raw) ? raw : [];
}

/**
 * Lấy giá trị đầu tiên không null/undefined trong các key camelCase/PascalCase của API payload.
 */
function pickRaw<T>(raw: Record<string, unknown> | null | undefined, ...keys: string[]): T | null {
  if (!raw) return null;
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return null;
}

/**
 * Helper hàm chuẩn hóa dữ liệu BookDetail từ API response.
 */
function normalizeBookDetail(raw: Record<string, unknown> | null): BookDetail {
  const list = (key1: string, key2: string): string[] => {
    const v = raw ? (raw[key1] ?? raw[key2]) : undefined;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  };

  return {
    id: pickRaw<string>(raw, 'id', 'bookId') || '',
    slug: pickRaw<string>(raw, 'slug', 'Slug') || '',
    title: pickRaw<string>(raw, 'title', 'Title') || 'Chưa có tiêu đề',
    summary: pickRaw<string | null>(raw, 'summary', 'Summary', 'description', 'Description'),
    publisherName: pickRaw<string | null>(raw, 'publisherName', 'PublisherName'),
    publicationYear: pickRaw<number | null>(raw, 'publicationYear', 'PublicationYear'),
    isbn: pickRaw<string | null>(raw, 'isbn', 'Isbn'),
    language: pickRaw<string | null>(raw, 'language', 'Language'),
    accessType: pickRaw<string>(raw, 'accessType', 'AccessType') || 'Free',
    status: pickRaw<string>(raw, 'status', 'Status') || 'PUBLISHED',
    totalChapters: pickRaw<number>(raw, 'totalChapters', 'TotalChapters') ?? 0,
    viewCount: pickRaw<number>(raw, 'viewCount', 'ViewCount') ?? 0,
    rating: pickRaw<number>(raw, 'rating', 'Rating') ?? 0,
    authorNames: list('authorNames', 'AuthorNames'),
    categoryNames: list('categoryNames', 'CategoryNames'),
    categoryIds: list('categoryIds', 'CategoryIds'),
    authorIds: list('authorIds', 'AuthorIds'),
  };
}

/**
 * Lấy thông tin chi tiết của một cuốn sách theo slug.
 * Được bọc bằng `react.cache` để Server Component page và generateMetadata chia sẻ cùng 1 request trong một lần render.
 */
export const getBookBySlug = cache(async (slug: string): Promise<BookDetail> => {
  const res = await fetch(`${API_URL}/Books/slug/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });

  if (res.status === 404) {
    throw new BookNotFoundError(slug);
  }

  if (!res.ok) {
    throw new Error(`Lỗi khi lấy thông tin sách (${res.status}): ${res.statusText}`);
  }

  const payload = await res.json();
  const raw = unwrapPayload<Record<string, unknown>>(payload);
  return normalizeBookDetail(raw);
});

/**
 * Lấy danh sách các chương của cuốn sách theo bookId.
 * Đường dẫn API đúng theo ChaptersController của Backend: GET /api/books/{bookId}/chapters
 * Sắp xếp tăng dần theo số thứ tự chương.
 */
export async function getChapters(bookId: string): Promise<ChapterSummary[]> {
  const res = await fetch(`${API_URL}/books/${encodeURIComponent(bookId)}/chapters`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Lỗi khi lấy danh sách chương (${res.status})`);
  }

  const payload = await res.json();
  const rawList = unwrapArray(payload);

  const chapters: ChapterSummary[] = rawList.map((item: unknown) => {
    const ch = item as Record<string, unknown>;
    const chapterNumber = pickRaw<number>(ch, 'number', 'chapterNumber') ?? 0;
    return {
      id: pickRaw<string>(ch, 'id', 'chapterId') ?? '',
      bookId: pickRaw<string>(ch, 'bookId') ?? bookId,
      title: pickRaw<string>(ch, 'title') ?? `Chương ${chapterNumber}`,
      number: chapterNumber,
      summary: pickRaw<string | null>(ch, 'summary'),
      status: pickRaw<string>(ch, 'status') ?? 'PUBLISHED',
      wordCount: pickRaw<number>(ch, 'wordCount') ?? 0,
      readingTime: pickRaw<number>(ch, 'readingTime') ?? 0,
    };
  });

  // Sắp xếp chương theo thứ tự tăng dần
  return chapters.sort((a, b) => a.number - b.number);
}

/**
 * Lấy tiến độ đọc sách của người dùng hiện tại đối với sách này.
 * Đường dẫn API đúng theo ReadingController: GET /api/Reading/progress/{bookId}
 * CHỈ DÙNG TRÊN SERVER: Đọc cookie accessToken và chuyển tiếp tới backend qua Cookie header.
 * Trả về null nếu chưa đăng nhập (401) hoặc chưa có tiến độ (404).
 */
export async function getReadingProgress(bookId: string): Promise<ReadingProgressDetail | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Cookie'] = `accessToken=${token}`;
  }

  const res = await fetch(`${API_URL}/Reading/progress/${encodeURIComponent(bookId)}`, {
    headers,
    cache: 'no-store',
  });

  if (res.status === 401 || res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Lỗi khi lấy tiến độ đọc (${res.status})`);
  }

  const payload = await res.json();
  const raw = unwrapPayload<Record<string, unknown>>(payload);

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return {
    chapterId: pickRaw<string>(raw, 'chapterId') || '',
    chapterNumber: pickRaw<number>(raw, 'chapterNumber', 'number') ?? 1,
    scrollPosition: pickRaw<number>(raw, 'scrollPosition') ?? 0,
    percentage: Math.min(100, Math.max(0, pickRaw<number>(raw, 'percentage') ?? 0)),
    status: pickRaw<string>(raw, 'status') || 'Reading',
    version: pickRaw<number>(raw, 'version') ?? 1,
    lastReadAt: pickRaw<string>(raw, 'lastReadAt') || new Date().toISOString(),
  };
}

/**
 * Lấy thông tin ảnh bìa của sách từ API FilesController: GET /api/Files/book/{bookId}/cover
 * Trả về null nếu API trả về 404 hoặc không có fileUrl.
 * Chuẩn hóa relative path sang absolute URL với API origin.
 */
export async function getBookCover(bookId: string): Promise<BookFile | null> {
  const res = await fetch(`${API_URL}/Files/book/${encodeURIComponent(bookId)}/cover`, {
    cache: 'no-store',
  });

  if (res.status === 404 || !res.ok) {
    return null;
  }

  const payload = await res.json();
  const raw = unwrapPayload<Record<string, unknown>>(payload);

  const fileUrl = pickRaw<string>(raw, 'fileUrl');
  const normalizedUrl = normalizeFileUrl(fileUrl);
  if (!raw || !normalizedUrl) {
    return null;
  }

  return {
    fileUrl: normalizedUrl,
    fileType: pickRaw<string>(raw, 'fileType') || 'Cover',
    fileName: pickRaw<string>(raw, 'fileName') || 'cover',
  };
}

/**
 * Lấy thông tin tệp nội dung sách (PDF, EPUB...) từ API FilesController: GET /api/Files/book/{bookId}/content
 * Trả về null nếu 404 hoặc không có fileUrl.
 * Chuẩn hóa relative path sang absolute URL với API origin.
 */
export async function getBookContent(bookId: string, contentType = 'PDF'): Promise<BookFile | null> {
  const res = await fetch(
    `${API_URL}/Files/book/${encodeURIComponent(bookId)}/content?contentType=${encodeURIComponent(contentType)}`,
    { cache: 'no-store' }
  );

  if (res.status === 404 || !res.ok) {
    return null;
  }

  const payload = await res.json();
  const raw = unwrapPayload<Record<string, unknown>>(payload);

  const fileUrl = pickRaw<string>(raw, 'fileUrl');
  const normalizedUrl = normalizeFileUrl(fileUrl);
  if (!raw || !normalizedUrl) {
    return null;
  }

  return {
    fileUrl: normalizedUrl,
    fileType: pickRaw<string>(raw, 'fileType') || contentType,
    fileName: pickRaw<string>(raw, 'fileName') || `book.${contentType.toLowerCase()}`,
  };
}

/**
 * Lấy danh sách sách gợi ý cho độc giả theo endpoint: GET /api/search/recommendations?limit={limit}
 * Ném lỗi khi HTTP status không ok để Promise.allSettled phía Server Component ghi nhận đúng rejection state.
 */
export async function getRecommendations(limit = 6): Promise<BookRecommendation[]> {
  const res = await fetch(`${API_URL}/search/recommendations?limit=${limit}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Lỗi khi lấy danh sách gợi ý (${res.status})`);
  }

  const payload = await res.json();
  const rawList = unwrapArray(payload);

  const items: BookRecommendation[] = rawList.map((item: unknown) => {
    const rec = item as Record<string, unknown>;

    const list = (key1: string, key2: string): string[] => {
      const v = rec[key1] ?? rec[key2];
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    };

    const id = pickRaw<string>(rec, 'id', 'bookId') ?? '';
    const coverRaw = pickRaw<string>(rec, 'coverImage', 'coverImageUrl', 'coverAssetId', 'CoverAssetId');

    return {
      id,
      slug: pickRaw<string>(rec, 'slug', 'Slug') ?? id,
      title: pickRaw<string>(rec, 'title', 'Title') ?? 'Chưa có tiêu đề',
      summary: pickRaw<string | null>(rec, 'summary', 'description'),
      rating: pickRaw<number>(rec, 'rating') ?? 0,
      status: pickRaw<string>(rec, 'status') ?? 'PUBLISHED',
      publicationYear: pickRaw<number | null>(rec, 'publicationYear'),
      authorNames: list('authorNames', 'AuthorNames'),
      categoryNames: list('categoryNames', 'CategoryNames'),
      coverImage: normalizeFileUrl(coverRaw) || undefined,
    };
  });

  // Lọc chỉ giữ lại các sách có ID và title hợp lệ
  return items.filter((item) => item.id && item.title);
}
