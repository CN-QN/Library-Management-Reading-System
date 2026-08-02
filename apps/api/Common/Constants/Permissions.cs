namespace api.Common.Constants;

public static class Permissions
{
    // User
    public const string UserRead = "user.read";
    public const string UserCreate = "user.create";
    public const string UserUpdate = "user.update";
    public const string UserLock = "user.lock";
    public const string UserAssignRole = "user.assign_role";

    // Role
    public const string RoleRead = "role.read";
    public const string RoleCreate = "role.create";
    public const string RoleUpdate = "role.update";
    public const string RoleAssignPermission = "role.assign_permission";

    // Book
    public const string BookRead = "book.read";
    public const string BookCreate = "book.create";
    public const string BookUpdate = "book.update";
    public const string BookArchive = "book.archive";
    public const string BookPublish = "book.publish";
    public const string BookDelete = "book.delete";

    // Chapter
    public const string ChapterRead = "chapter.read";
    public const string ChapterCreate = "chapter.create";
    public const string ChapterUpdate = "chapter.update";
    public const string ChapterPublish = "chapter.publish";
    public const string ChapterDelete = "chapter.delete";

    // Copy / Inventory
    public const string CopyRead = "copy.read";
    public const string CopyCreate = "copy.create";
    public const string CopyUpdateStatus = "copy.update_status";
    public const string InventoryTransfer = "inventory.transfer";
    public const string InventoryAudit = "inventory.audit";

    // Loan / Borrowing
    public const string LoanCreate = "loan.create";        // Mượn sách
    public const string LoanRead = "loan.read";            // Xem danh sách mượn ⬅️ THÊM
    public const string LoanReturn = "loan.return";        // Trả sách
    public const string LoanExtend = "loan.extend";        // Gia hạn
    public const string LoanManage = "loan.manage";        // Quản lý mượn ⬅️ THÊM
    public const string ReservationApprove = "reservation.approve";
    public const string FineWaive = "fine.waive";

    // Reading
    public const string ReadingRead = "reading.read";
    public const string ProgressUpdate = "progress.update";
    public const string BookmarkManage = "bookmark.manage";
    public const string AnnotationManage = "annotation.manage";

    // Review
    public const string ReviewCreate = "review.create";
    public const string ReviewModerate = "review.moderate";
    public const string ListManage = "list.manage";

    // Report
    public const string ReportView = "report.view";
    public const string ReportExport = "report.export";

    // System
    public const string SettingRead = "setting.read";
    public const string SettingUpdate = "setting.update";
    public const string AuditRead = "audit.read";
    public const string FileManage = "file.manage";

    public const string NotificationSend = "notification.send";
    public const string NotificationBroadcast = "notification.broadcast";
}
