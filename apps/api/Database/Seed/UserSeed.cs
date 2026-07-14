namespace api.Database.Seed;

public static class UserSeed
{
    public class UserSeedItem
    {
        public string Email { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string RoleCode { get; set; } = string.Empty;
    }

    public static readonly List<UserSeedItem> Users = new()
    {
        new UserSeedItem { Email = "admin@libraryhub.com", StudentCode = "ADM001", FullName = "System Administrator", RoleCode = "SUPER_ADMIN" },
        new UserSeedItem { Email = "libadmin@libraryhub.com", StudentCode = "LAD001", FullName = "Branch Library Admin", RoleCode = "LIBRARY_ADMIN" },
        new UserSeedItem { Email = "librarian@libraryhub.com", StudentCode = "LIB001", FullName = "Branch Librarian", RoleCode = "LIBRARIAN" },
        new UserSeedItem { Email = "editor@libraryhub.com", StudentCode = "EDI001", FullName = "Digital Content Editor", RoleCode = "CONTENT_EDITOR" },
        new UserSeedItem { Email = "inventory@libraryhub.com", StudentCode = "INV001", FullName = "Inventory Officer", RoleCode = "INVENTORY_STAFF" },
        new UserSeedItem { Email = "student@libraryhub.com", StudentCode = "STU001", FullName = "Library Student Member", RoleCode = "STUDENT" },
        new UserSeedItem { Email = "guest@libraryhub.com", StudentCode = "GST001", FullName = "Guest Visitor", RoleCode = "GUEST" },
        new UserSeedItem { Email = "worker@libraryhub.com", StudentCode = "WRK001", FullName = "System Worker Service", RoleCode = "SYSTEM_WORKER" }
    };
}
