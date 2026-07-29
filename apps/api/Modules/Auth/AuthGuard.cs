using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using api.Common.Constants;
using api.Common.Models;
using System.Security.Claims;

namespace api.Auth;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    public string[] Permissions { get; }

    public RequirePermissionAttribute(params string[] permissions)
    {
        Permissions = permissions;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            context.Result = new JsonResult(ErrorResponse(401, ErrorCodes.AUTH_001, "Unauthorized access."))
            {
                StatusCode = 401
            };
            return;
        }

        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new JsonResult(ErrorResponse(401, ErrorCodes.AUTH_001, "Invalid token identity."))
            {
                StatusCode = 401
            };
            return;
        }

        var authService = context.HttpContext.RequestServices.GetRequiredService<AuthService>();
        var userPermissions = await authService.GetCachedPermissionsAsync(userId);

        // Check if user has ALL of the required permissions (AND logic)
        foreach (var requiredPerm in Permissions)
        {
            if (!userPermissions.Contains(requiredPerm))
            {
                context.Result = new JsonResult(ErrorResponse(403, ErrorCodes.PERM_001, $"Forbidden. Missing required permission: {requiredPerm}"))
                {
                    StatusCode = 403
                };
                return;
            }
        }
    }

    private ErrorResponse ErrorResponse(int statusCode, string errorCode, string message)
    {
        return new ErrorResponse
        {
            Success = false,
            StatusCode = statusCode,
            ErrorCode = errorCode,
            Message = message
        };
    }
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequireAnyPermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    public string[] Permissions { get; }

    public RequireAnyPermissionAttribute(params string[] permissions)
    {
        Permissions = permissions;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            context.Result = new JsonResult(ErrorResponse(401, ErrorCodes.AUTH_001, "Unauthorized access."))
            {
                StatusCode = 401
            };
            return;
        }

        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new JsonResult(ErrorResponse(401, ErrorCodes.AUTH_001, "Invalid token identity."))
            {
                StatusCode = 401
            };
            return;
        }

        var authService = context.HttpContext.RequestServices.GetRequiredService<AuthService>();
        var userPermissions = await authService.GetCachedPermissionsAsync(userId);

        // Check if user has ANY of the required permissions (OR logic)
        var hasAny = Permissions.Any(perm => userPermissions.Contains(perm));
        if (!hasAny)
        {
            context.Result = new JsonResult(ErrorResponse(403, ErrorCodes.PERM_001, $"Forbidden. Requires one of: {string.Join(", ", Permissions)}"))
            {
                StatusCode = 403
            };
        }
    }

    private ErrorResponse ErrorResponse(int statusCode, string errorCode, string message)
    {
        return new ErrorResponse
        {
            Success = false,
            StatusCode = statusCode,
            ErrorCode = errorCode,
            Message = message
        };
    }
}
