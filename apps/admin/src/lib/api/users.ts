import { apiClient } from "@/lib/api-client";
import type { PagedResult } from "./books";

/** Mirrors `UserRoleDetailDto`. */
export interface UserRoleDetail {
  userRoleId: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  branchId?: string | null;
  branchName?: string | null;
  expiresAt?: string | null;
}

/** Mirrors `UserDto`. */
export interface AppUser {
  id: string;
  email: string;
  studentCode: string;
  fullName: string;
  status: string;
  branchId?: string | null;
  avatar?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  assignedRoles: UserRoleDetail[];
}

/** Mirrors `CreateUserRequest`. */
export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  branchId?: string;
}

export interface BranchOption {
  id: string;
  code?: string | null;
  name: string;
}

/** Mirrors `UpdateUserRequest`. */
export interface UpdateUserInput {
  fullName: string;
  avatar?: string;
  branchId?: string;
}

export interface UserQuery {
  search?: string;
  status?: string;
  branchId?: string;
  page: number;
  limit: number;
}

function buildQueryString(query: UserQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.branchId) params.set("branchId", query.branchId);
  return params.toString();
}

import { circulationApi } from "./circulation";

export interface UserReadingHistoryItem {
  id: string;
  bookId: string;
  bookTitle?: string;
  bookSlug?: string;
  bookCoverImage?: string;
  authorName?: string;
  chapterId?: string;
  chapterNumber?: number;
  percentage?: number;
  status?: string;
  lastReadAt?: string;
}

export const usersApi = {
  search: (query: UserQuery) =>
    apiClient.get<PagedResult<AppUser>>(`/api/users?${buildQueryString(query)}`),

  getById: (id: string) => apiClient.get<AppUser>(`/api/users/${id}`),

  create: (input: CreateUserInput) => apiClient.post<AppUser>("/api/users", input),

  branches: () => apiClient.get<BranchOption[]>("/api/users/branches"),

  update: (id: string, input: UpdateUserInput) =>
    apiClient.put<AppUser>(`/api/users/${id}`, input),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<void>(`/api/users/${id}/status`, { status }),

  assignRole: (id: string, roleId: string, branchId?: string, expiresAt?: string) =>
    apiClient.post<void>(`/api/users/${id}/roles`, { roleId, branchId, expiresAt }),

  removeRole: (id: string, userRoleId: string) =>
    apiClient.delete<void>(`/api/users/${id}/roles/${userRoleId}`),

  getCurrentBorrowings: (id: string) =>
    circulationApi.search({ userId: id, page: 1, limit: 20 }),

  getReadingHistory: (id: string) =>
    apiClient.get<UserReadingHistoryItem[]>(`/api/Reading/user/${id}`),
};
