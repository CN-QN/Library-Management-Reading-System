import { apiClient } from "@/lib/api-client";
import type { PagedResult } from "./books";

/** Mirrors `AuthorResponseDto`. */
export interface Author {
  id: string;
  name: string;
  slug: string;
  biography?: string | null;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorQuery {
  search?: string;
  page: number;
  pageSize: number;
}

export interface CreateAuthorInput {
  name: string;
  biography?: string;
  avatar?: string;
}

export type UpdateAuthorInput = CreateAuthorInput;

export const authorsApi = {
  // Query params are page/pageSize (per AuthorsController), but the
  // response body is the shared PagedResult<T> shape — so it comes
  // back with `limit`, not `pageSize`.
  search: (query: AuthorQuery) => {
    const params = new URLSearchParams();
    params.set("page", String(query.page));
    params.set("pageSize", String(query.pageSize));
    if (query.search) params.set("search", query.search);
    return apiClient.get<PagedResult<Author>>(`/api/authors?${params.toString()}`);
  },

  getById: (id: string) => apiClient.get<Author>(`/api/authors/${id}`),

  create: (input: CreateAuthorInput) => apiClient.post<Author>("/api/authors", input),

  update: (id: string, input: UpdateAuthorInput) =>
    apiClient.put<Author>(`/api/authors/${id}`, input),

  delete: (id: string) => apiClient.delete<void>(`/api/authors/${id}`),
};
