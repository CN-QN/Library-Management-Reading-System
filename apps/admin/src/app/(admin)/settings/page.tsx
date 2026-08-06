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

const DEFAULT_SYSTEM_SETTINGS: SystemSetting[] = [
  { id: "1", key: "Smtp:Host", value: "smtp.gmail.com", scope: "GLOBAL", description: "Máy chủ gửi Email thông báo & OTP Token", updatedAt: "2026-08-01T00:00:00Z" },
  { id: "2", key: "Smtp:Port", value: "587", scope: "GLOBAL", description: "Cổng SMTP SSL 587", updatedAt: "2026-08-01T00:00:00Z" },
  { id: "3", key: "SePay:BankAccount", value: "105886719416", scope: "GLOBAL", description: "Số tài khoản ngân hàng VietinBank nhận tiền VietQR 10k", updatedAt: "2026-08-01T00:00:00Z" },
  { id: "4", key: "SePay:BankName", value: "VietinBank", scope: "GLOBAL", description: "Ngân hàng TMCP Công Thương Việt Nam", updatedAt: "2026-08-01T00:00:00Z" },
  { id: "5", key: "Cloudinary:CloudName", value: "demo", scope: "GLOBAL", description: "Tên tài khoản Cloudinary lưu trữ ảnh bìa sách & media", updatedAt: "2026-08-01T00:00:00Z" },
  { id: "6", key: "Borrowing:MaxBorrowLimit", value: "5", scope: "GLOBAL", description: "Số lượng sách giấy tối đa độc giả được mượn cùng lúc", updatedAt: "2026-08-01T00:00:00Z" },
  { id: "7", key: "Borrowing:FinePerDay", value: "5000", scope: "GLOBAL", description: "Số tiền phạt quá hạn (VNĐ/ngày)", updatedAt: "2026-08-01T00:00:00Z" },
];

export default function SettingsPage() {
  const { can } = useAuth();
  const fetchSettings = useCallback(() => settingsApi.list(), []);
  const { data, error, isLoading, retry } = useAsync(fetchSettings);

  const [editing, setEditing] = useState<SystemSetting | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const settingsList = data && data.length > 0 ? data : DEFAULT_SYSTEM_SETTINGS;

  const columns: Column<SystemSetting>[] = [
    {
      key: "key",
      header: "Mã Cài Đặt (Key)",
      render: (s) => <span className="font-mono text-xs font-bold text-slate-900">{s.key}</span>,
    },
    {
      key: "value",
      header: "Giá trị cài đặt",
      render: (s) => <span className="max-w-xs truncate font-medium text-slate-700">{s.value}</span>,
    },
    {
      key: "scope",
      header: "Phạm vi",
      render: (s) => <Badge variant="info">{s.scope}</Badge>,
    },
    {
      key: "description",
      header: "Mô tả chức năng",
      render: (s) => <span className="text-xs text-slate-500">{s.description ?? "—"}</span>,
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
            className="rounded-md px-2.5 py-1 text-xs font-bold text-amber-600 hover:bg-amber-50 cursor-pointer"
          >
            Chỉnh sửa
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cấu Hình Thông Số Hệ Thống</h1>
          <p className="text-xs text-slate-500">
            Quản lý các thông số kết nối máy chủ Mail SMTP, Ngân hàng SePay, Cloudinary và Quy định mượn trả thư viện.
          </p>
        </div>
        {can(Permissions.SettingUpdate) && (
          <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
            + Thêm cài đặt mới
          </Button>
        )}
      </div>

      <Card>
        <CardHeader title="Danh sách các tham số cài đặt" description={`${settingsList.length} tham số cấu hình`} />
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
              data={settingsList}
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
