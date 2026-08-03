using System.Security.Claims;
using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Modules.ReservationsAndFines.DTOs;
using api.Modules.ReservationsAndFines.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.ReservationsAndFines.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FinesController : ControllerBase
    {
        private readonly IFineService _fineService;
        private readonly ILogger<FinesController> _logger;

        public FinesController(IFineService fineService, ILogger<FinesController> logger)
        {
            _fineService = fineService;
            _logger = logger;
        }

        /// <summary>
        /// Danh sách tiền phạt (phân trang, lọc theo user, status, reason)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetList(
            [FromQuery] string? userId,
            [FromQuery] string? status,
            [FromQuery] string? reason,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10)
        {
            try
            {
                var (items, total) = await _fineService.GetFinesAsync(userId, status, reason, page, Math.Min(limit, 100));
                var pagedResult = new PagedResult<FineResponseDto>(items, page, limit, total);
                return Ok(ApiResponse<PagedResult<FineResponseDto>>.SuccessResponse(
                    pagedResult,
                    "Lấy danh sách tiền phạt thành công.",
                    new { page, limit, total }
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách tiền phạt.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi tra cứu tiền phạt."));
            }
        }

        /// <summary>
        /// Chi tiết khoản phạt theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var result = await _fineService.GetFineByIdAsync(id);
                if (result == null)
                {
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy thông tin khoản phạt."));
                }
                return Ok(ApiResponse<FineResponseDto>.SuccessResponse(result, "Lấy thông tin tiền phạt thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tra cứu khoản phạt {Id}", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi tra cứu khoản phạt."));
            }
        }

        /// <summary>
        /// Thanh toán khoản phạt tại quầy
        /// </summary>
        [HttpPost("{id}/pay")]
        public async Task<IActionResult> Pay(string id, [FromBody] PayFineDto dto)
        {
            try
            {
                var result = await _fineService.PayFineAsync(id, dto);
                return Ok(ApiResponse<FineResponseDto>.SuccessResponse(result, "Thanh toán tiền phạt thành công."));
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
                _logger.LogError(ex, "Lỗi khi nộp tiền phạt {Id}", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xử lý thanh toán tiền phạt."));
            }
        }

        /// <summary>
        /// Miễn giảm khoản phạt (Thủ thư / Admin)
        /// </summary>
        [HttpPost("{id}/waive")]
        [RequirePermission(Permissions.FineWaive)]
        public async Task<IActionResult> Waive(string id, [FromBody] WaiveFineDto dto)
        {
            try
            {
                var actorUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _fineService.WaiveFineAsync(id, dto, actorUserId);
                return Ok(ApiResponse<FineResponseDto>.SuccessResponse(result, "Đã miễn giảm khoản phạt thành công."));
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
                _logger.LogError(ex, "Lỗi khi miễn phạt khoản tiền {Id}", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xử lý miễn giảm tiền phạt."));
            }
        }
    }
}
