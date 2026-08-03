import type { ReactNode } from "react";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const VARIANT_CLASSES: Record<Variant, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}

/**
 * Maps the status enums from the backend (Phụ lục A.1 — Trạng thái chuẩn)
 * to a Badge variant + Vietnamese label. Extend as new statuses appear.
 */
const STATUS_MAP: Record<string, { label: string; variant: Variant }> = {
  // User
  ACTIVE: { label: "Đang hoạt động", variant: "success" },
  LOCKED: { label: "Đã khóa", variant: "danger" },
  PENDING: { label: "Chờ xử lý", variant: "warning" },
  SUSPENDED: { label: "Tạm ngưng", variant: "warning" },
  DELETED: { label: "Đã xóa", variant: "neutral" },
  // Book / Chapter
  DRAFT: { label: "Bản nháp", variant: "neutral" },
  REVIEW: { label: "Đang duyệt", variant: "warning" },
  PUBLISHED: { label: "Đã xuất bản", variant: "success" },
  ARCHIVED: { label: "Đã lưu trữ", variant: "neutral" },
  HIDDEN: { label: "Đã ẩn", variant: "neutral" },
  // Book copy
  AVAILABLE: { label: "Sẵn có", variant: "success" },
  BORROWED: { label: "Đang mượn", variant: "info" },
  RESERVED: { label: "Đã đặt trước", variant: "warning" },
  LOST: { label: "Bị mất", variant: "danger" },
  DAMAGED: { label: "Hư hỏng", variant: "danger" },
  MAINTENANCE: { label: "Bảo trì", variant: "neutral" },
  // Borrowing
  OPEN: { label: "Đang mượn", variant: "info" },
  PARTIALLY_RETURNED: { label: "Trả một phần", variant: "warning" },
  RETURNED: { label: "Đã trả", variant: "success" },
  OVERDUE: { label: "Quá hạn", variant: "danger" },
  CANCELLED: { label: "Đã hủy", variant: "neutral" },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, variant: "neutral" as Variant };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
