using Microsoft.AspNetCore.Authorization;

namespace api.Common.Authorization
{
    public class RequirePermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }

        public RequirePermissionRequirement(string permission)
        {
            Permission = permission;
        }
    }

    public class RequirePermissionHandler : AuthorizationHandler<RequirePermissionRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            RequirePermissionRequirement requirement)
        {
            // TODO: Implement permission check
            // For now, allow all authenticated users
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                context.Succeed(requirement);
            }
            else
            {
                context.Fail();
            }

            return Task.CompletedTask;
        }
    }
}