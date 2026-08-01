/**
 * Shared types mirroring the backend's response envelope and DTOs.
 * Keep this in sync with `apps/api/Common/Models/ApiResponse.cs` and
 * `apps/api/Modules/Auth/DTOs/AuthDtos.cs`.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: unknown;
  traceId: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorCode?: string;
  traceId?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface UserProfile {
  id: string;
  email: string;
  studentCode: string;
  fullName: string;
  branchId?: string | null;
  avatar?: string | null;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}
