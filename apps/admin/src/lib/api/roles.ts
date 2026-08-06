import { apiClient } from "@/lib/api-client";
export interface Permission { id: string; code: string; resource: string; action: string; description: string; }
export interface Role { id: string; code: string; name: string; scope: string; status: string; permissions: Permission[]; }
export const rolesApi = {
  list: () => apiClient.get<Role[]>("/api/admin/roles"),
  permissions: () => apiClient.get<Permission[]>("/api/admin/roles/permissions"),
  create: (input: { code: string; name: string; scope: string }) => apiClient.post<Role>("/api/admin/roles", input),
  update: (id: string, input: { name: string; scope: string; status: string }) => apiClient.put<Role>(`/api/admin/roles/${id}`, input),
  addPermission: (id: string, permissionId: string) => apiClient.post<void>(`/api/admin/roles/${id}/permissions`, { permissionId }),
  removePermission: (id: string, permissionId: string) => apiClient.delete<void>(`/api/admin/roles/${id}/permissions/${permissionId}`),
};
