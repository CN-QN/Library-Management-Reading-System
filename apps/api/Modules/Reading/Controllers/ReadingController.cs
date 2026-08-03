using System.Security.Claims;
using api.Common.Models;
using api.Modules.Reading.DTOs;
using api.Modules.Reading.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Reading.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReadingController : ControllerBase
    {
        private readonly IReadingProgressService _progressService;
        private readonly ILogger<ReadingController> _logger;

        public ReadingController(IReadingProgressService progressService, ILogger<ReadingController> logger)
        {
            _progressService = progressService;
            _logger = logger;
        }

        /// <summary>
        /// Autosave tiến trình đọc sách của độc giả
        /// </summary>
        [HttpPost("progress")]
        public async Task<IActionResult> SaveProgress([FromBody] SaveReadingProgressDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được danh tính người dùng."));
                }

                var result = await _progressService.SaveProgressAsync(userId, dto);
                
                // Trả về tiến trình (nếu có conflict thì tiến trình mới hơn sẽ được trả về)
                if (result.Version > dto.Version)
                {
                    return Ok(ApiResponse<ReadingProgressResponseDto>.SuccessResponse(result, "Phát hiện phiên bản mới hơn trên hệ thống. Đã đồng bộ tiến trình mới nhất.", null, 200));
                }

                return Ok(ApiResponse<ReadingProgressResponseDto>.SuccessResponse(result, "Lưu tiến trình đọc sách thành công."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(404, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra khi lưu tiến trình đọc sách.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lưu tiến trình đọc."));
            }
        }


        /// <summary>
        /// Khởi tạo phiên đọc mới
        /// </summary>
        [HttpPost("sessions/start")]
        public async Task<IActionResult> StartSession([FromBody] StartReadingSessionDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được danh tính người dùng."));
                }

                var result = await _progressService.StartReadingSessionAsync(userId, dto);
                return Ok(ApiResponse<ReadingSessionResponseDto>.SuccessResponse(result, "Khởi tạo phiên đọc sách thành công."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(404, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi khởi tạo phiên đọc sách.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi tạo phiên đọc."));
            }
        }

        /// <summary>
        /// Gửi heartbeat định kỳ để duy trì phiên đọc và tính toán thời lượng đọc
        /// </summary>
        [HttpPost("sessions/{sessionId}/heartbeat")]
        public async Task<IActionResult> HeartbeatSession(string sessionId)
        {
            try
            {
                var result = await _progressService.HeartbeatSessionAsync(sessionId);
                return Ok(ApiResponse<ReadingSessionResponseDto>.SuccessResponse(result, "Duy trì phiên đọc thành công."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(404, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi heartbeat phiên đọc {SessionId}", sessionId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xử lý duy trì phiên đọc."));
            }
        }

        /// <summary>
        /// Kết thúc phiên đọc sách
        /// </summary>
        [HttpPost("sessions/{sessionId}/end")]
        public async Task<IActionResult> EndSession(string sessionId)
        {
            try
            {
                var result = await _progressService.EndReadingSessionAsync(sessionId);
                return Ok(ApiResponse<ReadingSessionResponseDto>.SuccessResponse(result, "Kết thúc phiên đọc sách thành công."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(404, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kết thúc phiên đọc {SessionId}", sessionId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi kết thúc phiên đọc."));
            }
        }
    }
}
