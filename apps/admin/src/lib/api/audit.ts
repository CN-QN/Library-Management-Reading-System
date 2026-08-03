import { apiClient } from "@/lib/api-client";
import type { PagedResult } from "./books";

/** Mirrors the `AuditLog` entity (returned directly by AuditController). */
export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  before?: string | null;
  after?: string | null;
  ip: string;
  userAgent: string;
  traceId: string;
  createdAt: string;
}

export interface AuditLogQuery {
  actorId?: string;
  action?: string;
  resource?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  limit: number;
}

function buildQueryString(query: AuditLogQuery): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.actorId) params.set("actorId", query.actorId);
  if (query.action) params.set("action", query.action);
  if (query.resource) params.set("resource", query.resource);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  return params.toString();
}

export const auditApi = {
  search: (query: AuditLogQuery) =>
    apiClient.get<PagedResult<AuditLogEntry>>(`/api/audit-logs?${buildQueryString(query)}`),
};
