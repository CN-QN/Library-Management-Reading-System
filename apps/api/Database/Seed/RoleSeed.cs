using api.Database.Entities;

namespace api.Database.Seed;

public static class RoleSeed
{
    public static readonly List<Role> Roles = new()
    {
        new Role { Code = "SUPER_ADMIN", Name = "Super Administrator", Scope = "GLOBAL" },
        new Role { Code = "LIBRARY_ADMIN", Name = "Library Administrator", Scope = "BRANCH" },
        new Role { Code = "LIBRARIAN", Name = "Librarian", Scope = "BRANCH" },
        new Role { Code = "CONTENT_EDITOR", Name = "Content Editor", Scope = "GLOBAL" },
        new Role { Code = "INVENTORY_STAFF", Name = "Inventory Staff", Scope = "BRANCH" },
        new Role { Code = "STUDENT", Name = "Student Member", Scope = "GLOBAL" },
        new Role { Code = "GUEST", Name = "Guest Viewer", Scope = "GLOBAL" },
        new Role { Code = "SYSTEM_WORKER", Name = "System Worker", Scope = "GLOBAL" }
    };
}
