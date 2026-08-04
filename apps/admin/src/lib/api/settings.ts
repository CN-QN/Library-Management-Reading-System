import { apiClient } from "@/lib/api-client";

/** Mirrors `SystemSettingDto`. */
export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  scope: string;
  description?: string | null;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface UpdateSettingInput {
  value: string;
  description?: string;
  scope?: string;
}

export const settingsApi = {
  list: (scope?: string) =>
    apiClient.get<SystemSetting[]>(`/api/settings${scope ? `?scope=${scope}` : ""}`),

  getByKey: (key: string) => apiClient.get<SystemSetting>(`/api/settings/${key}`),

  /** Upsert — creates the setting if `key` doesn't exist yet, otherwise updates it. */
  update: (key: string, input: UpdateSettingInput) =>
    apiClient.put<SystemSetting>(`/api/settings/${key}`, input),
};
