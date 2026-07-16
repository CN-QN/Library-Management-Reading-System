using System.Net;
using api.Database;
using api.Common.Models;
using System.Text.Json;

namespace api.Middleware;

public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitMiddleware> _logger;

    public RateLimitMiddleware(RequestDelegate next, ILogger<RateLimitMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RedisContext redisContext)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var path = context.Request.Path.Value ?? "/";

        // Skip health check endpoints
        if (path.Contains("health"))
        {
            await _next(context);
            return;
        }

        try
        {
            var db = redisContext.GetDatabase();
            
            // Set limit properties based on endpoints
            var limit = 60; // 60 requests per minute by default
            var periodSeconds = 60;
            var scope = "general";

            if (path.Contains("login"))
            {
                limit = 5; // max 5 attempts
                periodSeconds = 60 * 15; // per 15 minutes
                scope = "login";
            }
            else if (path.Contains("search") || path.Contains("discovery"))
            {
                limit = 30; // max 30 searches per minute
                periodSeconds = 60;
                scope = "search";
            }

            var key = $"rate_limit:{scope}:{ip}";
            
            // Check if key exists and increment
            var count = await db.StringIncrementAsync(key);
            
            if (count == 1)
            {
                // First request, set expiration
                await db.KeyExpireAsync(key, TimeSpan.FromSeconds(periodSeconds));
            }

            if (count > limit)
            {
                _logger.LogWarning("Rate limit exceeded for IP {IP} on scope {Scope}", ip, scope);
                
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.ContentType = "application/json";
                
                var traceId = context.Items["TraceId"]?.ToString() ?? context.TraceIdentifier;
                var response = new ErrorResponse
                {
                    Success = false,
                    StatusCode = (int)HttpStatusCode.TooManyRequests,
                    ErrorCode = "RATE_LIMIT_EXCEEDED",
                    Message = $"Too many requests. Please try again after {periodSeconds} seconds.",
                    TraceId = traceId
                };
                
                var json = JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                await context.Response.WriteAsync(json);
                return;
            }
        }
        catch (Exception ex)
        {
            // Do not break the system if Redis is down (resiliency)
            _logger.LogError(ex, "Error checking rate limit in Redis. Bypassing rate limiting.");
        }

        await _next(context);
    }
}
