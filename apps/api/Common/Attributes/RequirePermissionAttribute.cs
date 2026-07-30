using Microsoft.AspNetCore.Authorization;

namespace LibraryManagement.Shared.Attributes
{
    public class RequirePermissionAttribute : AuthorizeAttribute
    {
        public RequirePermissionAttribute(string permission)
            : base($"Permission_{permission}")
        {
        }
    }
}