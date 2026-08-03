import { apiClient } from "@/lib/api-client";

/** Mirrors `PermissionDto`. */
export interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string;
}

/** Mirrors `RoleDto`. */
export interface Role {
  id: string;
  code: string;
  name: string;
  scope: string;
  status: string;
  permissions: Permission[];
}

export const rolesApi = {
  list: () => apiClient.get<Role[]>("/api/roles"),
};
