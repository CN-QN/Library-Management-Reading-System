import { apiClient } from "@/lib/api-client";

export interface AdminSetting { id: string; key: string; value: string; scope: string; description?: string | null; isConfigured: boolean; updatedAt: string; }
export type SystemSetting = AdminSetting;
export interface AdminSettingUpdate { key: string; value: string; scope: string; description?: string; }
export const settingsApi = {
  list: (scope?: string) => apiClient.get<AdminSetting[]>(`/api/admin/settings${scope ? `?scope=${encodeURIComponent(scope)}` : ""}`),
  save: (updates: AdminSettingUpdate[]) => apiClient.put<AdminSetting[]>("/api/admin/settings", updates),
  update: (key: string, input: { value: string; scope?: string; description?: string }) => apiClient.put<AdminSetting[]>("/api/admin/settings", [{ key, scope: input.scope ?? "SYSTEM", ...input }]),
};
