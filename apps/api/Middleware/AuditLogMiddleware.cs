using api.Database;
using api.Database.Entities;
using System.Security.Claims;

namespace api.Middleware;

public class AuditLogMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditLogMiddleware> _logger;

    public AuditLogMiddleware(RequestDelegate next, ILogger<AuditLogMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, MongoDbContext dbContext)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;

        // Call the next middleware in pipeline first so the action executes
        await _next(context);

        // Only log mutating requests (POST, PUT, PATCH, DELETE) that were successful (2xx status codes)
        var isMutating = method == "POST" || method == "PUT" || method == "PATCH" || method == "DELETE";
        var isSuccessful = context.Response.StatusCode >= 200 && context.Response.StatusCode < 300;

        if (isMutating && isSuccessful && !path.Contains("health"))
        {
            try
            {
                var actorId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var traceId = context.Items["TraceId"]?.ToString() ?? context.TraceIdentifier;
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
                var userAgent = context.Request.Headers["User-Agent"].ToString();

                // Extract resource & resourceId from path e.g., /api/users/abc -> resource: users, resourceId: abc
                var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
                var resource = "system";
                string? resourceId = null;

                if (segments.Length > 0)
                {
                    // Skip 'api' prefix if present
                    int index = segments[0].Equals("api", StringComparison.OrdinalIgnoreCase) ? 1 : 0;
                    
                    if (segments.Length > index)
                    {
                        resource = segments[index];
                    }
                    if (segments.Length > index + 1)
                    {
                        resourceId = segments[index + 1];
                    }
                }

                var auditLog = new AuditLog
                {
                    ActorId = actorId,
                    Action = method,
                    Resource = resource,
                    ResourceId = resourceId,
                    Ip = ip,
                    UserAgent = userAgent,
                    TraceId = traceId,
                    CreatedAt = DateTime.UtcNow
                };

                await dbContext.AuditLogs.InsertOneAsync(auditLog);
            }
            catch (Exception ex)
            {
                // Never block the user request because audit logging fails
                _logger.LogError(ex, "Failed to write audit log for request {Method} {Path}", method, path);
            }
        }
    }
}
