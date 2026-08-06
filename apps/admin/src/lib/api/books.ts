import { apiClient } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Embedded catalog snapshot types — mirrors the backend DTOs produced by
// Task 3 (MongoDB embedded aggregate migration).
// ---------------------------------------------------------------------------

export interface BookAuthorSnapshot {
  authorId: string;
  name: string;
  slug: string;
  role: string;
  order: number;
}

export interface BookCategorySnapshot {
  categoryId: string;
  name: string;
  slug: string;
}

export interface BookPublisherSnapshot {
  publisherId: string;
  name: string;
  slug: string;
}

export interface BookChapterSummary {
  id: string;
  bookId: string;
  title: string;
  number: number;
  summary: string | null;
  status: string;
  wordCount: number;
  readingTime: number;
}

// ---------------------------------------------------------------------------
// Response shape — mirrors `BookResponseDto`.
// ---------------------------------------------------------------------------

/** Mirrors `BookResponseDto` (apps/api/Modules/Catalog/DTOs/Responses). */
export interface Book {
  id: string;
  title: string;
  slug: string;
  isbn?: string | null;
  summary?: string | null;
  publicationYear?: number | null;
  language: string;
  accessType: string;
  price: number;
  status: string;
  coverAssetId?: string | null;
  totalChapters: number;
  viewCount: number;
  rating: number;
  /** Embedded author snapshots. */
  authors: BookAuthorSnapshot[];
  /** Embedded category snapshots. */
  categories: BookCategorySnapshot[];
  /** Embedded publisher snapshot (null if none). */
  publisher: BookPublisherSnapshot | null;
  /** Convenience flat arrays kept for backward-compatible display. */
  authorNames: string[];
  categoryNames: string[];
  /** @deprecated Use publisher.name instead */
  publisherName?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors `PagedResult<T>` (apps/api/Common/Models). */
export interface PagedResult<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

/** Mirrors `BookQueryDto`. */
export interface BookQuery {
  keyword?: string;
  categoryId?: string;
  authorId?: string;
  status?: string;
  accessType?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

/**
 * Mirrors `CreateBookDto`.
 * Authors, categories, and publisher are sent as embedded snapshots —
 * NOT as foreign-key ID arrays.
 */
export interface CreateBookInput {
  title: string;
  isbn?: string;
  summary?: string;
  publicationYear?: number;
  language?: string;
  accessType?: string;
  price?: number;
  authors: BookAuthorSnapshot[];
  categories: BookCategorySnapshot[];
  publisher?: BookPublisherSnapshot;
}

/** Mirrors `UpdateBookDto`. */
export interface UpdateBookInput {
  title?: string;
  summary?: string;
  publicationYear?: number;
  language?: string;
  accessType?: string;
  price?: number;
  authors?: BookAuthorSnapshot[];
  categories?: BookCategorySnapshot[];
  publisher?: BookPublisherSnapshot | null;
}

function buildQueryString(query: BookQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  params.set("sortBy", query.sortBy);
  params.set("sortOrder", query.sortOrder);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.authorId) params.set("authorId", query.authorId);
  if (query.status) params.set("status", query.status);
  if (query.accessType) params.set("accessType", query.accessType);
  return params.toString();
}

export const booksApi = {
  search: (query: BookQuery) =>
    apiClient.get<PagedResult<Book>>(`/api/books?${buildQueryString(query)}`),

  getById: (id: string) => apiClient.get<Book>(`/api/books/${id}`),

  create: (input: CreateBookInput) => apiClient.post<Book>("/api/books", input),

  update: (id: string, input: UpdateBookInput) =>
    apiClient.put<Book>(`/api/books/${id}`, input),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<Book>(`/api/books/${id}/status`, { status }),

  /** Soft-delete/archive — the backend's DELETE endpoint archives, it doesn't hard-delete. */
  archive: (id: string) => apiClient.delete<void>(`/api/books/${id}`),

  validateSlug: (slug: string) =>
    apiClient.get<{ isValid: boolean }>(`/api/books/validate-slug/${encodeURIComponent(slug)}`),

  validateIsbn: (isbn: string) =>
    apiClient.get<{ isValid: boolean }>(`/api/books/validate-isbn/${encodeURIComponent(isbn)}`),

  /**
   * Uploads and links a book cover through the unified admin media pipeline.
   */
  uploadCover: (bookId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("usageType", "book-cover");
    formData.append("category", "book-cover");
    formData.append("referenceId", bookId);
    return apiClient
      .post<{ id: string; fileUrl: string }>(
        "/api/admin/media/upload",
        formData
      )
      .then((res) => ({ url: res.fileUrl }));
  },
};
