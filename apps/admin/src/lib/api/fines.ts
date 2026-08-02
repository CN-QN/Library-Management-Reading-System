import { apiClient } from "@/lib/api-client";
import type { PagedResult } from "./books";

/** Mirrors `FineResponseDto`. */
export interface Fine {
  id: string;
  userId: string;
  userName?: string | null;
  studentCode?: string | null;
  borrowingId: string;
  borrowingCode?: string | null;
  borrowingItemId?: string | null;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
  waivedAt?: string | null;
  waivedBy?: string | null;
  waivedByName?: string | null;
  note?: string | null;
}

export interface FineQuery {
  userId?: string;
  status?: string;
  reason?: string;
  page: number;
  limit: number;
}

function buildQueryString(query: FineQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.userId) params.set("userId", query.userId);
  if (query.status) params.set("status", query.status);
  if (query.reason) params.set("reason", query.reason);
  return params.toString();
}

export const finesApi = {
  // Note: the backend has no borrowingId query param — callers that need
  // "fines for this borrowing" fetch by userId and filter client-side.
  search: (query: FineQuery) =>
    apiClient.get<PagedResult<Fine>>(`/api/fines?${buildQueryString(query)}`),

  getById: (id: string) => apiClient.get<Fine>(`/api/fines/${id}`),

  pay: (id: string, note?: string) => apiClient.post<Fine>(`/api/fines/${id}/pay`, { note }),

  waive: (id: string, reason: string, note?: string) =>
    apiClient.post<Fine>(`/api/fines/${id}/waive`, { reason, note }),
};
