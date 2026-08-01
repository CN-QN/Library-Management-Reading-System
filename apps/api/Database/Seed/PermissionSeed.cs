using Constants = api.Common.Constants;
using api.Database.Entities;

namespace api.Database.Seed;

public static class PermissionSeed
{
    public static readonly List<Permission> Permissions = new()
    {
        // Users
        new Permission { Code = Constants.Permissions.UserRead, Resource = "user", Action = "read", Description = "View users" },
        new Permission { Code = Constants.Permissions.UserCreate, Resource = "user", Action = "create", Description = "Create users" },
        new Permission { Code = Constants.Permissions.UserUpdate, Resource = "user", Action = "update", Description = "Update user details" },
        new Permission { Code = Constants.Permissions.UserLock, Resource = "user", Action = "lock", Description = "Lock/unlock user accounts" },
        new Permission { Code = Constants.Permissions.UserAssignRole, Resource = "user", Action = "assign_role", Description = "Assign roles to users" },

        // Roles
        new Permission { Code = Constants.Permissions.RoleRead, Resource = "role", Action = "read", Description = "View roles and permissions" },
        new Permission { Code = Constants.Permissions.RoleCreate, Resource = "role", Action = "create", Description = "Create new roles" },
        new Permission { Code = Constants.Permissions.RoleUpdate, Resource = "role", Action = "update", Description = "Update roles" },
        new Permission { Code = Constants.Permissions.RoleAssignPermission, Resource = "role", Action = "assign_permission", Description = "Assign permissions to roles" },

        // Books
        new Permission { Code = Constants.Permissions.BookRead, Resource = "book", Action = "read", Description = "View book details" },
        new Permission { Code = Constants.Permissions.BookCreate, Resource = "book", Action = "create", Description = "Create new books" },
        new Permission { Code = Constants.Permissions.BookUpdate, Resource = "book", Action = "update", Description = "Update books" },
        new Permission { Code = Constants.Permissions.BookArchive, Resource = "book", Action = "archive", Description = "Archive books" },
        new Permission { Code = Constants.Permissions.BookPublish, Resource = "book", Action = "publish", Description = "Publish books" },
        new Permission { Code = Constants.Permissions.BookDelete, Resource = "book", Action = "delete", Description = "Delete books" },

        // Chapters
        new Permission { Code = Constants.Permissions.ChapterRead, Resource = "chapter", Action = "read", Description = "View chapters" },
        new Permission { Code = Constants.Permissions.ChapterCreate, Resource = "chapter", Action = "create", Description = "Create new chapters" },
        new Permission { Code = Constants.Permissions.ChapterUpdate, Resource = "chapter", Action = "update", Description = "Update chapters" },
        new Permission { Code = Constants.Permissions.ChapterPublish, Resource = "chapter", Action = "publish", Description = "Publish chapters" },
        new Permission { Code = Constants.Permissions.ChapterDelete, Resource = "chapter", Action = "delete", Description = "Delete chapters" },

        // Copies
        new Permission { Code = Constants.Permissions.CopyRead, Resource = "copy", Action = "read", Description = "View book copies" },
        new Permission { Code = Constants.Permissions.CopyCreate, Resource = "copy", Action = "create", Description = "Add book copies" },
        new Permission { Code = Constants.Permissions.CopyUpdateStatus, Resource = "copy", Action = "update_status", Description = "Update copy statuses" },
        new Permission { Code = Constants.Permissions.InventoryTransfer, Resource = "inventory", Action = "transfer", Description = "Transfer copies between branches" },
        new Permission { Code = Constants.Permissions.InventoryAudit, Resource = "inventory", Action = "audit", Description = "Audit inventory" },

        // Circulation
        new Permission { Code = Constants.Permissions.LoanCreate, Resource = "loan", Action = "create", Description = "Check out books" },
        new Permission { Code = Constants.Permissions.LoanReturn, Resource = "loan", Action = "return", Description = "Return books" },
        new Permission { Code = Constants.Permissions.LoanExtend, Resource = "loan", Action = "extend", Description = "Extend/renew book loans" },
        new Permission { Code = Constants.Permissions.ReservationApprove, Resource = "reservation", Action = "approve", Description = "Approve reservations" },
        new Permission { Code = Constants.Permissions.FineWaive, Resource = "fine", Action = "waive", Description = "Waive unpaid fines" },

        // Reading
        new Permission { Code = Constants.Permissions.ReadingRead, Resource = "reading", Action = "read", Description = "Read digital content" },
        new Permission { Code = Constants.Permissions.ProgressUpdate, Resource = "progress", Action = "update", Description = "Save reading progress" },
        new Permission { Code = Constants.Permissions.BookmarkManage, Resource = "bookmark", Action = "manage", Description = "Manage bookmarks" },
        new Permission { Code = Constants.Permissions.AnnotationManage, Resource = "annotation", Action = "manage", Description = "Manage highlights and notes" },

        // Social
        new Permission { Code = Constants.Permissions.ReviewCreate, Resource = "review", Action = "create", Description = "Write book reviews" },
        new Permission { Code = Constants.Permissions.ReviewModerate, Resource = "review", Action = "moderate", Description = "Moderate reviews" },
        new Permission { Code = Constants.Permissions.ListManage, Resource = "list", Action = "manage", Description = "Manage reading lists" },

        // Reports
        new Permission { Code = Constants.Permissions.ReportView, Resource = "report", Action = "view", Description = "View dashboard statistics and reports" },
        new Permission { Code = Constants.Permissions.ReportExport, Resource = "report", Action = "export", Description = "Export reports" },

        // System
        new Permission { Code = Constants.Permissions.SettingRead, Resource = "setting", Action = "read", Description = "Read system settings" },
        new Permission { Code = Constants.Permissions.SettingUpdate, Resource = "setting", Action = "update", Description = "Update system settings" },
        new Permission { Code = Constants.Permissions.AuditRead, Resource = "audit", Action = "read", Description = "View audit logs" },
        new Permission { Code = Constants.Permissions.FileManage, Resource = "file", Action = "manage", Description = "Manage media uploads" },

        // Notifications
        new Permission { Code = Constants.Permissions.NotificationSend, Resource = "notification", Action = "send", Description = "Send notification to a user" },
        new Permission { Code = Constants.Permissions.NotificationBroadcast, Resource = "notification", Action = "broadcast", Description = "Broadcast system notification" }
    };

    // Role code -> lists of permission codes
    public static readonly Dictionary<string, List<string>> RolePermissionsMapping = new()
    {
        {
            "SUPER_ADMIN", 
            Permissions.Select(p => p.Code).ToList()
        },
        {
            "LIBRARY_ADMIN", new()
            {
                Constants.Permissions.UserRead, Constants.Permissions.UserCreate, Constants.Permissions.UserUpdate, Constants.Permissions.UserLock,
                Constants.Permissions.BookRead, Constants.Permissions.BookCreate, Constants.Permissions.BookUpdate, Constants.Permissions.BookArchive,
                Constants.Permissions.CopyRead, Constants.Permissions.CopyCreate, Constants.Permissions.CopyUpdateStatus,
                Constants.Permissions.LoanCreate, Constants.Permissions.LoanReturn, Constants.Permissions.LoanExtend,
                Constants.Permissions.ReportView, Constants.Permissions.ReportExport,
                Constants.Permissions.SettingRead, Constants.Permissions.SettingUpdate, Constants.Permissions.AuditRead,
                Constants.Permissions.NotificationSend, Constants.Permissions.NotificationBroadcast
            }
        },
        {
            "LIBRARIAN", new()
            {
                Constants.Permissions.UserRead,
                Constants.Permissions.BookRead,
                Constants.Permissions.CopyRead, Constants.Permissions.CopyUpdateStatus,
                Constants.Permissions.LoanCreate, Constants.Permissions.LoanReturn, Constants.Permissions.LoanExtend, Constants.Permissions.ReservationApprove,
                Constants.Permissions.ReportView
            }
        },
        {
            "CONTENT_EDITOR", new()
            {
                Constants.Permissions.BookRead, Constants.Permissions.BookCreate, Constants.Permissions.BookUpdate, Constants.Permissions.BookArchive, Constants.Permissions.BookPublish,
                Constants.Permissions.ChapterRead, Constants.Permissions.ChapterCreate, Constants.Permissions.ChapterUpdate, Constants.Permissions.ChapterPublish, Constants.Permissions.ChapterDelete,
                Constants.Permissions.FileManage
            }
        },
        {
            "INVENTORY_STAFF", new()
            {
                Constants.Permissions.BookRead,
                Constants.Permissions.CopyRead, Constants.Permissions.CopyCreate, Constants.Permissions.CopyUpdateStatus,
                Constants.Permissions.InventoryTransfer, Constants.Permissions.InventoryAudit
            }
        },
        {
            "STUDENT", new()
            {
                Constants.Permissions.BookRead,
                Constants.Permissions.ChapterRead,
                Constants.Permissions.ReadingRead, Constants.Permissions.ProgressUpdate, Constants.Permissions.BookmarkManage, Constants.Permissions.AnnotationManage,
                Constants.Permissions.ReviewCreate, Constants.Permissions.ListManage
            }
        },
        {
            "GUEST", new()
            {
                Constants.Permissions.BookRead
            }
        },
        {
            "SYSTEM_WORKER", new()
            {
                Constants.Permissions.ProgressUpdate,
                Constants.Permissions.ReportView, Constants.Permissions.ReportExport
            }
        }
    };
}
