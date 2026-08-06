using System.Security.Claims;
using api.Common.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace api.Common.Middleware;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RedisRateLimitAttribute : Attribute, IAsyncActionFilter
{
    public int MaxRequests { get; set; } = 10;
    public int WindowSeconds { get; set; } = 60;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;

        // 1. BỎ QUA HOÀN TOÀN CÁC REQUEST OPTIONS (CORS PREFLIGHT)
        if (HttpMethods.IsOptions(httpContext.Request.Method))
        {
            await next();
            return;
        }

        // 2. Định danh người dùng: Ưu tiên UserId nếu đã đăng nhập, nếu chưa thì lấy IP
        var userId = httpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip";
        var identifier = !string.IsNullOrWhiteSpace(userId) ? $"user_{userId}" : $"ip_{clientIp}";

        // 3. Tên endpoint
        var endpoint = httpContext.Request.Path.ToString().Trim('/').ToLowerInvariant();

        // 4. Lấy RateLimiterService từ DI Container
        var rateLimiter = httpContext.RequestServices.GetService<IRedisRateLimiterService>();
        if (rateLimiter != null)
        {
            var isAllowed = await rateLimiter.IsAllowedAsync(identifier, endpoint, MaxRequests, WindowSeconds);
            if (!isAllowed)
            {
                context.Result = new ObjectResult(ApiResponse<object>.ErrorResponse(
                    429,
                    $"Thao tác quá nhanh! Bạn đã vượt quá giới hạn cho phép ({MaxRequests} lần / {WindowSeconds} giây). Vui lòng thử lại sau chốc lát."
                ))
                {
                    StatusCode = 429
                };
                return;
            }
        }

        await next();
    }
}
