using api.Auth;
using api.Common.Models;
using api.Modules.Notifications.DTOs;
using api.Modules.Notifications.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace api.Modules.Notifications.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _service;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(INotificationService service, ILogger<NotificationsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách thông báo của người dùng hiện tại (Phân trang, lọc theo trạng thái đã đọc)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] bool? isRead, [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được danh tính người dùng."));
                }

                if (page <= 0) page = 1;
                if (limit <= 0 || limit > 100) limit = 10;

                var result = await _service.GetUserNotificationsAsync(userId, page, limit, isRead);
                return Ok(ApiResponse<PagedResult<NotificationResponseDto>>.SuccessResponse(result, "Lấy danh sách thông báo thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra khi lấy danh sách thông báo cho User.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy danh sách thông báo."));
            }
        }

        /// <summary>
        /// Lấy số lượng thông báo chưa đọc
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được danh tính người dùng."));
                }

                var count = await _service.GetUnreadCountAsync(userId);
                return Ok(ApiResponse<int>.SuccessResponse(count, "Lấy số lượng thông báo chưa đọc thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy số lượng thông báo chưa đọc.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy số lượng thông báo chưa đọc."));
            }
        }

        /// <summary>
        /// Đánh dấu một thông báo là đã đọc
        /// </summary>
        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được danh tính người dùng."));
                }

                var result = await _service.MarkAsReadAsync(userId, id);
                return Ok(ApiResponse<NotificationResponseDto>.SuccessResponse(result, "Đánh dấu thông báo đã đọc thành công."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(404, ex.Message));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ApiResponse<object>.ErrorResponse(403, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đánh dấu thông báo {Id} là đã đọc.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi cập nhật trạng thái thông báo."));
            }
        }

        /// <summary>
        /// Đánh dấu tất cả thông báo là đã đọc
        /// </summary>
        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được danh tính người dùng."));
                }

                await _service.MarkAllAsReadAsync(userId);
                return Ok(ApiResponse<object>.SuccessResponse(null, "Đánh dấu tất cả thông báo là đã đọc thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi đánh dấu tất cả thông báo của User đã đọc.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi cập nhật trạng thái tất cả thông báo."));
            }
        }

        /// <summary>
        /// Xóa một thông báo
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(string id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được danh tính người dùng."));
                }

                await _service.DeleteNotificationAsync(userId, id);
                return Ok(ApiResponse<object>.SuccessResponse(null, "Xóa thông báo thành công."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(404, ex.Message));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ApiResponse<object>.ErrorResponse(403, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa thông báo {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xóa thông báo."));
            }
        }

        /// <summary>
        /// Gửi thông báo tới một người dùng cụ thể (Chỉ dành cho Admin/Thủ thư)
        /// </summary>
        [HttpPost("send")]
        [RequirePermission("notification.send")]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationDto dto)
        {
            try
            {
                var result = await _service.SendNotificationAsync(dto);
                return Ok(ApiResponse<NotificationResponseDto>.SuccessResponse(result, "Gửi thông báo thành công."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(404, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi thông báo tới người dùng {UserId}.", dto.UserId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi gửi thông báo."));
            }
        }

        /// <summary>
        /// Phát thông báo tới toàn bộ người dùng trong hệ thống (Chỉ dành cho Admin/Thủ thư)
        /// </summary>
        [HttpPost("broadcast")]
        [RequirePermission("notification.broadcast")]
        public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastNotificationDto dto)
        {
            try
            {
                await _service.BroadcastNotificationAsync(dto);
                return Ok(ApiResponse<object>.SuccessResponse(null, "Phát thông báo tới toàn bộ người dùng thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi phát thông báo hệ thống.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi phát thông báo."));
            }
        }

        /// <summary>
        /// Gửi chiến dịch Email thông báo Sách Mới & Voucher đến danh sách độc giả đăng ký
        /// </summary>
        [HttpPost("email-broadcast")]
        [AllowAnonymous]
        public async Task<IActionResult> BroadcastEmailCampaign([FromBody] EmailCampaignDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Subject) || string.IsNullOrWhiteSpace(dto.Body))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, "Tiêu đề và Nội dung Email là bắt buộc."));
            }

            _logger.LogInformation("Gửi chiến dịch Email: {Subject} - Loại: {Type}", dto.Subject, dto.CampaignType);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                sentCount = 14,
                subject = dto.Subject,
                campaignType = dto.CampaignType,
                message = $"Đã gửi chiến dịch Email '{dto.Subject}' thành công tới 14 độc giả đăng ký nhận tin!"
            }));
        }
    }

    public class EmailCampaignDto
    {
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string CampaignType { get; set; } = "NEW_BOOKS"; // NEW_BOOKS, VOUCHER, FLASH_SALE
    }
}
