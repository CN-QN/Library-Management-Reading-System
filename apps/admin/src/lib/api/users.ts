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
  studentCode: string;
  branchId?: string;
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

export const usersApi = {
  search: (query: UserQuery) =>
    apiClient.get<PagedResult<AppUser>>(`/api/users?${buildQueryString(query)}`),

  getById: (id: string) => apiClient.get<AppUser>(`/api/users/${id}`),

  create: (input: CreateUserInput) => apiClient.post<AppUser>("/api/users", input),

  update: (id: string, input: UpdateUserInput) =>
    apiClient.put<AppUser>(`/api/users/${id}`, input),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<void>(`/api/users/${id}/status`, { status }),

  assignRole: (id: string, roleId: string, branchId?: string, expiresAt?: string) =>
    apiClient.post<void>(`/api/users/${id}/roles`, { roleId, branchId, expiresAt }),

  removeRole: (id: string, userRoleId: string) =>
    apiClient.delete<void>(`/api/users/${id}/roles/${userRoleId}`),

  /**
   * ⚠️ NOT YET IMPLEMENTED ON THE BACKEND — there is no Circulation/
   * Borrowing module yet (only Auth/Catalog/DigitalContent/Inventory/
   * Roles/Users exist), so a user's current loans have no endpoint.
   * Suggested contract: `GET /api/users/{id}/borrowings` returning the
   * user's open `borrowings`/`borrowing_items` (see design doc M06).
   */
  getCurrentBorrowings: (id: string) =>
    apiClient.get<unknown[]>(`/api/users/${id}/borrowings`),

  /**
   * ⚠️ NOT YET IMPLEMENTED ON THE BACKEND — there is no Reading
   * Progress module yet either. Suggested contract:
   * `GET /api/users/{id}/reading-history` returning recent
   * `reading_progress`/`reading_sessions` entries (see design doc M09).
   */
  getReadingHistory: (id: string) =>
    apiClient.get<unknown[]>(`/api/users/${id}/reading-history`),
};
