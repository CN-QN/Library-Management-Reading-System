import { apiClient } from "@/lib/api-client";
export interface MediaAsset { id: string; fileUrl: string; originalFileName: string; fileSize: number; width: number; height: number; format: string; category: string; usageType: string; createdAt: string; }
export interface PagedMedia { items: MediaAsset[]; page: number; limit: number; totalItems: number; totalPages: number; }
export const mediaApi = {
  list: (category = "") => apiClient.get<PagedMedia>(`/api/admin/media?pageSize=100${category ? `&category=${encodeURIComponent(category)}` : ""}`),
  upload: (file: File, usageType: string, category: string) => { const body = new FormData(); body.append("file", file); body.append("usageType", usageType); body.append("category", category); return apiClient.post<MediaAsset>("/api/admin/media/upload", body); },
  remove: (id: string) => apiClient.delete<void>(`/api/admin/media/${id}`),
};
