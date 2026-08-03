"use client";

import { useCallback, useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { settingsApi, type SystemSetting } from "@/lib/api/settings";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingFormModal } from "@/components/settings/setting-form-modal";
import { Permissions } from "@/lib/permissions";

export default function SettingsPage() {
  const { can } = useAuth();
  const fetchSettings = useCallback(() => settingsApi.list(), []);
  const { data, error, isLoading, retry } = useAsync(fetchSettings);

  const [editing, setEditing] = useState<SystemSetting | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const columns: Column<SystemSetting>[] = [
    {
      key: "key",
      header: "Key",
      render: (s) => <span className="font-mono text-xs">{s.key}</span>,
    },
    {
      key: "value",
      header: "Giá trị",
      render: (s) => <span className="max-w-xs truncate">{s.value}</span>,
    },
    {
      key: "scope",
      header: "Phạm vi",
      render: (s) => <Badge variant="info">{s.scope}</Badge>,
    },
    {
      key: "description",
      header: "Mô tả",
      render: (s) => s.description ?? "—",
    },
    {
      key: "updatedAt",
      header: "Cập nhật lúc",
      render: (s) => new Date(s.updatedAt).toLocaleString("vi-VN"),
    },
    {
      key: "actions",
      header: "",
      render: (s) =>
        can(Permissions.SettingUpdate) ? (
          <button
            type="button"
            onClick={() => setEditing(s)}
            className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Sửa
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cấu hình hệ thống</h1>
          <p className="text-sm text-slate-500">
            Backend chưa có API xóa cài đặt — chỉ có thể tạo mới hoặc cập nhật giá trị.
          </p>
        </div>
        {can(Permissions.SettingUpdate) && (
          <Button onClick={() => setIsCreateOpen(true)}>+ Thêm cài đặt mới</Button>
        )}
      </div>

      <Card>
        <CardHeader title="Danh sách cài đặt" description={`${data?.length ?? 0} mục`} />
        <CardBody>
          {error ? (
            <ErrorState
              message={
                error instanceof ApiError
                  ? describeErrorCode(error.errorCode, error.message)
                  : "Không thể tải cấu hình hệ thống."
              }
              onRetry={retry}
            />
          ) : (
            <DataTable
              columns={columns}
              data={data ?? []}
              isLoading={isLoading}
              emptyMessage="Chưa có cài đặt nào."
              getRowKey={(s) => s.id}
            />
          )}
        </CardBody>
      </Card>

      <SettingFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        setting={null}
        onSaved={retry}
      />
      <SettingFormModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        setting={editing}
        onSaved={retry}
      />
    </div>
  );
}
