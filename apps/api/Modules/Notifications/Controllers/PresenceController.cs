using api.Common.Models;
using api.Database;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using System.Security.Claims;

namespace api.Modules.Notifications.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PresenceController : ControllerBase
{
    private readonly RedisContext _redisContext;
    private readonly ILogger<PresenceController> _logger;

    public PresenceController(RedisContext redisContext, ILogger<PresenceController> logger)
    {
        _redisContext = redisContext;
        _logger = logger;
    }

    /// <summary>
    /// Độc giả gửi Heartbeat cập nhật trạng thái Online vào Redis RAM (TTL 5 phút)
    /// </summary>
    [HttpPost("heartbeat")]
    [Authorize]
    public async Task<IActionResult> Heartbeat()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Chưa xác thực"));
        }

        try
        {
            var db = _redisContext.GetDatabase();
            var key = $"online_user:{userId}";

            // Lưu trạng thái online vào Redis với thời gian hết hạn TTL 5 phút
            await db.StringSetAsync(key, DateTime.UtcNow.ToString("o"), TimeSpan.FromMinutes(5));

            return Ok(ApiResponse<object>.SuccessResponse(null, "Heartbeat đã ghi nhận"));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Lỗi khi ghi nhận heartbeat cho user {UserId}", userId);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Fallback heartbeat"));
        }
    }

    /// <summary>
    /// Lấy số lượng độc giả đang Online thực tế từ Redis RAM (< 1ms)
    /// </summary>
    [HttpGet("online-count")]
    public async Task<IActionResult> GetOnlineCount()
    {
        try
        {
            var db = _redisContext.GetDatabase();
            var server = _redisContext.GetServer();

            if (server != null && server.IsConnected)
            {
                // Quét tất cả các key pattern "online_user:*" trong Redis Memory
                var keys = server.Keys(pattern: "online_user:*").ToArray();
                return Ok(ApiResponse<object>.SuccessResponse(new { count = keys.Length }, "Lấy số lượng độc giả online thành công"));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { count = 1 }, "Lấy số lượng độc giả online (Default)"));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Lỗi khi đếm số lượng độc giả online từ Redis");
            return Ok(ApiResponse<object>.SuccessResponse(new { count = 1 }, "Fallback online count"));
        }
    }
}
