import { apiClient } from "@/lib/api-client";

/** Mirrors `BookResponseDto` (apps/api/Modules/Catalog/DTOs/Responses). */
export interface Book {
  id: string;
  title: string;
  slug: string;
  isbn?: string | null;
  summary?: string | null;
  publisherName?: string | null;
  publicationYear?: number | null;
  language: string;
  accessType: string;
  status: string;
  coverAssetId?: string | null;
  totalChapters: number;
  viewCount: number;
  rating: number;
  authorNames: string[];
  categoryNames: string[];
  categoryIds: string[];
  authorIds: string[];
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
 * Mirrors `CreateBookDto`. Note: the backend has no Authors/Categories
 * list endpoints yet, so `authorIds`/`categoryIds` are entered as raw
 * IDs for now (see BookForm) instead of a proper multi-select.
 */
export interface CreateBookInput {
  title: string;
  slug: string;
  isbn?: string;
  summary?: string;
  publisherId?: string;
  publicationYear?: number;
  language?: string;
  accessType?: string;
  authorIds: string[];
  categoryIds: string[];
}

/** Mirrors `UpdateBookDto` — now also supports publisher/authors/categories. */
export interface UpdateBookInput {
  title?: string;
  summary?: string;
  publisherId?: string;
  publicationYear?: number;
  language?: string;
  accessType?: string;
  categoryIds?: string[];
  authorIds?: string[];
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
   * Uploads a book cover via the real Files module
   * (`POST /api/files/upload-cover/{bookId}`, requires `file.manage`).
   */
  uploadCover: (bookId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient
      .post<{ fileId: string; fileName: string; fileUrl: string; fileType: string; fileSize: number }>(
        `/api/files/upload-cover/${bookId}`,
        formData
      )
      .then((res) => ({ url: res.fileUrl }));
  },
};
