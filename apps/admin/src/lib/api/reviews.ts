import { apiClient } from "@/lib/api-client";
export interface AdminReview { id: string; bookId: string; userId: string; userFullName: string; userEmail: string; rating: number; comment: string; status: string; createdAt: string; }
export interface PagedReviews { items: AdminReview[]; page: number; limit: number; totalItems: number; totalPages: number; }
export const reviewsApi = {
  list: (status = "", page = 1) => apiClient.get<PagedReviews>(`/api/admin/reviews?page=${page}&pageSize=20${status ? `&status=${status}` : ""}`),
  moderate: (id: string, status: string) => apiClient.patch<void>(`/api/admin/reviews/${id}/status`, { status }),
  remove: (id: string) => apiClient.delete<void>(`/api/admin/reviews/${id}`),
};
