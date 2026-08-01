import { apiClient } from "@/lib/api-client";
import type { PagedResult } from "./books";

/** Mirrors `BorrowingItemResponseDto` (Modules/Circulation). */
export interface BorrowingItem {
  id: string;
  borrowingId: string;
  copyId: string;
  barcode?: string | null;
  bookTitle?: string | null;
  shelfCode?: string | null;
  dueAt: string;
  returnedAt?: string | null;
  renewCount: number;
  conditionOut: string;
  conditionIn?: string | null;
  status: string;
}

/** Mirrors `BorrowingResponseDto` (Modules/Circulation). */
export interface Borrowing {
  id: string;
  code: string;
  userId: string;
  userName?: string | null;
  studentCode?: string | null;
  branchId: string;
  branchName?: string | null;
  status: string;
  borrowedAt: string;
  expectedReturnAt: string;
  closedAt?: string | null;
  createdBy: string;
  note?: string | null;
  items: BorrowingItem[];
}

/** Mirrors `CreateBorrowingDto` — 1 to 5 copies per checkout. */
export interface CreateBorrowingInput {
  userId: string;
  branchId: string;
  copyIds: string[];
  daysToBorrow?: number;
  note?: string;
}

export interface ReturnItemInput {
  itemId: string;
  conditionIn: string;
  note?: string;
}

export interface BorrowingQuery {
  userId?: string;
  branchId?: string;
  status?: string;
  keyword?: string;
  page: number;
  limit: number;
}

function buildQueryString(query: BorrowingQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.userId) params.set("userId", query.userId);
  if (query.branchId) params.set("branchId", query.branchId);
  if (query.status) params.set("status", query.status);
  if (query.keyword) params.set("keyword", query.keyword);
  return params.toString();
}

/** True if the borrowing has at least one still-open item past its due date. */
export function isBorrowingOverdue(borrowing: Borrowing): boolean {
  const now = Date.now();
  return borrowing.items.some(
    (item) => item.status === "BORROWED" && new Date(item.dueAt).getTime() < now
  );
}

export const circulationApi = {
  search: (query: BorrowingQuery) =>
    apiClient.get<PagedResult<Borrowing>>(`/api/borrowings?${buildQueryString(query)}`),

  getById: (id: string) => apiClient.get<Borrowing>(`/api/borrowings/${id}`),

  create: (input: CreateBorrowingInput) => apiClient.post<Borrowing>("/api/borrowings", input),

  returnItems: (id: string, items: ReturnItemInput[]) =>
    apiClient.post<Borrowing>(`/api/borrowings/${id}/return`, { returnedItems: items }),

  renewItem: (itemId: string, daysToExtend: number) =>
    apiClient.post<BorrowingItem>(`/api/borrowings/items/${itemId}/renew`, { daysToExtend }),

  markItemStatus: (itemId: string, status: "LOST" | "DAMAGED", conditionIn?: string, note?: string) =>
    apiClient.patch<BorrowingItem>(`/api/borrowings/items/${itemId}/status`, {
      status,
      conditionIn,
      note,
    }),
};
