import { apiClient } from "@/lib/api-client";

/** Mirrors `CopyResponseDto`. */
export interface Copy {
  id: string;
  bookId: string;
  bookTitle: string;
  branchId: string;
  branchName: string;
  barcode: string;
  shelfCode?: string | null;
  condition: string;
  status: string;
  price: number;
  acquiredAt: string;
  lastInventoryAt?: string | null;
  createdAt: string;
}

export const copiesApi = {
  getByBookId: (bookId: string) => apiClient.get<Copy[]>(`/api/copies/book/${bookId}`),
};
