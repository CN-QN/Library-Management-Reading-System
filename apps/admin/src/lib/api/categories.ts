import { apiClient } from "@/lib/api-client";

/** Mirrors the anonymous category projection returned by CategoriesController. */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  path?: string | null;
  status: string;
  displayOrder: number;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
  status?: string;
  displayOrder?: number;
}

export type UpdateCategoryInput = CreateCategoryInput;

export const categoriesApi = {
  list: (parentId?: string) =>
    apiClient.get<Category[]>(`/api/categories${parentId ? `?parentId=${parentId}` : ""}`),

  getById: (id: string) => apiClient.get<Category & { children: { id: string; name: string; slug: string }[] }>(`/api/categories/${id}`),

  create: (input: CreateCategoryInput) => apiClient.post<Category>("/api/categories", input),

  update: (id: string, input: UpdateCategoryInput) =>
    apiClient.put<Category>(`/api/categories/${id}`, input),

  delete: (id: string) => apiClient.delete<void>(`/api/categories/${id}`),
};
