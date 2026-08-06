using api.Database;
using StackExchange.Redis;

namespace api.Common.Middleware;

public interface IRedisRateLimiterService
{
    Task<bool> IsAllowedAsync(string identifier, string endpoint, int maxRequests, int windowSeconds);
}

public class RedisRateLimiterService : IRedisRateLimiterService
{
    private readonly RedisContext _redisContext;
    private readonly ILogger<RedisRateLimiterService> _logger;

    public RedisRateLimiterService(RedisContext redisContext, ILogger<RedisRateLimiterService> logger)
    {
        _redisContext = redisContext;
        _logger = logger;
    }

    public async Task<bool> IsAllowedAsync(string identifier, string endpoint, int maxRequests, int windowSeconds)
    {
        if (string.IsNullOrWhiteSpace(identifier))
        {
            identifier = "anonymous";
        }

        var key = $"rate_limit:{identifier}:{endpoint}";

        try
        {
            var db = _redisContext.GetDatabase();

            // Lệnh INCR nguyên tử của Redis
            var currentRequests = await db.StringIncrementAsync(key);

            // Request đầu tiên -> Cài TTL tự hủy sau windowSeconds (ví dụ: 60s)
            if (currentRequests == 1)
            {
                await db.KeyExpireAsync(key, TimeSpan.FromSeconds(windowSeconds));
            }

            return currentRequests <= maxRequests;
        }
        catch (Exception ex)
        {
            // Fail-Open strategy: Nếu Redis bị lỗi hoặc ngắt kết nối, ghi log và CHO QUA (không chặn người dùng)
            _logger.LogWarning(ex, "Redis RateLimiter gặp sự cố cho key {Key}. Đã bật chế độ Fail-Open cho qua.", key);
            return true;
        }
    }
}
