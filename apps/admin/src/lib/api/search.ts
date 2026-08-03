import { apiClient } from "@/lib/api-client";

/** Mirrors `BookSearchDto`. */
export interface SearchBookResult {
  bookId: string;
  title: string;
  slug: string;
  isbn?: string | null;
  summary?: string | null;
  publisherId?: string | null;
  coverAssetId?: string | null;
  accessType: string;
  status: string;
  publicationYear?: number | null;
  language: string;
  totalChapters: number;
  viewCount: number;
  readingCount: number;
  rating: number;
  ratingCount: number;
  authors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export const searchApi = {
  getTrending: (limit = 10) =>
    apiClient.get<SearchBookResult[]>(`/api/search/trending?limit=${limit}`),
};
