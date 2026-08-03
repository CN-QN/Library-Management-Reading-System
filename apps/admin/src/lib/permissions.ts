/**
 * Mirrors `apps/api/Common/Constants/Permissions.cs`.
 * Keep in sync when the backend adds/renames permissions.
 */
export const Permissions = {
  UserRead: "user.read",
  UserCreate: "user.create",
  UserUpdate: "user.update",
  UserLock: "user.lock",
  UserAssignRole: "user.assign_role",

  RoleRead: "role.read",
  RoleCreate: "role.create",
  RoleUpdate: "role.update",
  RoleAssignPermission: "role.assign_permission",

  BookRead: "book.read",
  BookCreate: "book.create",
  BookUpdate: "book.update",
  BookArchive: "book.archive",
  BookPublish: "book.publish",
  BookDelete: "book.delete",

  ChapterRead: "chapter.read",
  ChapterCreate: "chapter.create",
  ChapterUpdate: "chapter.update",
  ChapterPublish: "chapter.publish",
  ChapterDelete: "chapter.delete",

  CopyRead: "copy.read",
  CopyCreate: "copy.create",
  CopyUpdateStatus: "copy.update_status",
  InventoryTransfer: "inventory.transfer",
  InventoryAudit: "inventory.audit",

  LoanCreate: "loan.create",
  LoanReturn: "loan.return",
  LoanExtend: "loan.extend",
  ReservationApprove: "reservation.approve",
  FineWaive: "fine.waive",

  ReadingRead: "reading.read",
  ProgressUpdate: "progress.update",
  BookmarkManage: "bookmark.manage",
  AnnotationManage: "annotation.manage",

  ReviewCreate: "review.create",
  ReviewModerate: "review.moderate",
  ListManage: "list.manage",

  ReportView: "report.view",
  ReportExport: "report.export",

  SettingRead: "setting.read",
  SettingUpdate: "setting.update",
  AuditRead: "audit.read",
  FileManage: "file.manage",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

/** True if `granted` contains every permission in `required`. */
export function hasAllPermissions(
  granted: string[] | undefined | null,
  required: string[]
): boolean {
  if (!required.length) return true;
  if (!granted || granted.length === 0) return false;
  const set = new Set(granted);
  return required.every((perm) => set.has(perm));
}

/** True if `granted` contains at least one permission in `required`. */
export function hasAnyPermission(
  granted: string[] | undefined | null,
  required: string[]
): boolean {
  if (!required.length) return true;
  if (!granted || granted.length === 0) return false;
  const set = new Set(granted);
  return required.some((perm) => set.has(perm));
}
