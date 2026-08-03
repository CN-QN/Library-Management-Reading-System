"use client";

import { useCallback, useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { auditApi, type AuditLogEntry, type AuditLogQuery } from "@/lib/api/audit";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";

const PAGE_SIZE = 20;

const ACTION_VARIANT: Record<string, "success" | "info" | "danger" | "warning" | "neutral"> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  LOGIN: "neutral",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

export default function AuditLogsPage() {
  const [actorId, setActorId] = useState("");
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const debouncedActorId = useDebouncedValue(actorId);
  const debouncedResource = useDebouncedValue(resource);

  const fetchLogs = useCallback(() => {
    const query: AuditLogQuery = {
      actorId: debouncedActorId || undefined,
      resource: debouncedResource || undefined,
      action: action || undefined,
      page,
      limit: PAGE_SIZE,
    };
    return auditApi.search(query);
  }, [debouncedActorId, debouncedResource, action, page]);

  const { data, error, isLoading, retry } = useAsync(fetchLogs);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "createdAt",
      header: "Thời gian",
      render: (log) => formatDateTime(log.createdAt),
    },
    {
      key: "action",
      header: "Hành động",
      render: (log) => (
        <Badge variant={ACTION_VARIANT[log.action] ?? "neutral"}>{log.action}</Badge>
      ),
    },
    {
      key: "resource",
      header: "Tài nguyên",
      render: (log) => (
        <span>
          {log.resource}
          {log.resourceId && (
            <span className="text-slate-400"> · {log.resourceId.slice(0, 8)}…</span>
          )}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Người thực hiện",
      render: (log) => (log.actorId ? log.actorId.slice(0, 8) + "…" : "Hệ thống"),
    },
    {
      key: "ip",
      header: "IP",
      render: (log) => log.ip || "—",
    },
    {
      key: "actions",
      header: "",
      render: (log) => (
        <button
          type="button"
          onClick={() => setSelected(log)}
          className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Chi tiết
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Nhật ký hệ thống</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          placeholder="Lọc theo Actor ID"
          value={actorId}
          onChange={(e) => {
            setActorId(e.target.value);
            setPage(1);
          }}
        />
        <Input
          placeholder="Lọc theo tài nguyên (VD: books, users)"
          value={resource}
          onChange={(e) => {
            setResource(e.target.value);
            setPage(1);
          }}
        />
        <Input
          placeholder="Lọc theo hành động (VD: CREATE, UPDATE, DELETE)"
          value={action}
          onChange={(e) => {
            setAction(e.target.value.toUpperCase());
            setPage(1);
          }}
        />
      </div>

      {error ? (
        <ErrorState
          message={
            error instanceof ApiError
              ? describeErrorCode(error.errorCode, error.message)
              : "Không thể tải nhật ký hệ thống."
          }
          onRetry={retry}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy nhật ký nào phù hợp."
            getRowKey={(log) => log.id}
          />
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Chi tiết: ${selected?.action} ${selected?.resource}`}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium text-slate-600">Thời gian:</span>{" "}
              {formatDateTime(selected.createdAt)}
            </p>
            <p>
              <span className="font-medium text-slate-600">Actor:</span>{" "}
              {selected.actorId ?? "Hệ thống"}
            </p>
            <p>
              <span className="font-medium text-slate-600">Resource ID:</span>{" "}
              {selected.resourceId ?? "—"}
            </p>
            <p>
              <span className="font-medium text-slate-600">IP / User-Agent:</span> {selected.ip} ·{" "}
              {selected.userAgent}
            </p>
            {selected.before && (
              <div>
                <p className="mb-1 font-medium text-slate-600">Trước khi thay đổi:</p>
                <pre className="max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
                  {selected.before}
                </pre>
              </div>
            )}
            {selected.after && (
              <div>
                <p className="mb-1 font-medium text-slate-600">Sau khi thay đổi:</p>
                <pre className="max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
                  {selected.after}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
