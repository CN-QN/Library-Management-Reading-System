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
    public class ReservationsController : ControllerBase
    {
        private readonly IReservationService _reservationService;
        private readonly ILogger<ReservationsController> _logger;

        public ReservationsController(IReservationService reservationService, ILogger<ReservationsController> _logger)
        {
            _reservationService = reservationService;
            this._logger = _logger;
        }

        /// <summary>
        /// Tạo lượt đặt trước sách (Reservation)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReservationDto dto)
        {
            try
            {
                var result = await _reservationService.CreateReservationAsync(dto);
                return CreatedAtAction(
                    nameof(GetById),
                    new { id = result.Id },
                    ApiResponse<ReservationResponseDto>.SuccessResponse(result, "Đặt trước sách thành công.", null, 201)
                );
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
                _logger.LogError(ex, "Lỗi xảy ra khi tạo lượt đặt trước sách.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Đã xảy ra lỗi hệ thống khi xử lý đặt trước sách."));
            }
        }

        /// <summary>
        /// Tra cứu danh sách đặt trước (phân trang, lọc theo user, book, branch, status)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetList(
            [FromQuery] string? userId,
            [FromQuery] string? bookId,
            [FromQuery] string? branchId,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10)
        {
            try
            {
                var (items, total) = await _reservationService.GetReservationsAsync(userId, bookId, branchId, status, page, Math.Min(limit, 100));
                var pagedResult = new PagedResult<ReservationResponseDto>(items, page, limit, total);
                return Ok(ApiResponse<PagedResult<ReservationResponseDto>>.SuccessResponse(
                    pagedResult,
                    "Lấy danh sách đặt trước thành công.",
                    new { page, limit, total }
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách đặt trước sách.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy danh sách đặt trước."));
            }
        }

        /// <summary>
        /// Lấy chi tiết lượt đặt trước theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var result = await _reservationService.GetReservationByIdAsync(id);
                if (result == null)
                {
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy thông tin đặt trước."));
                }
                return Ok(ApiResponse<ReservationResponseDto>.SuccessResponse(result, "Lấy thông tin đặt trước thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy chi tiết lượt đặt trước {Id}", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi tra cứu lượt đặt trước."));
            }
        }

        /// <summary>
        /// Hủy lượt đặt trước sách
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(string id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _reservationService.CancelReservationAsync(id, userId);
                return Ok(ApiResponse<ReservationResponseDto>.SuccessResponse(result, "Hủy đặt trước thành công."));
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
                _logger.LogError(ex, "Lỗi khi hủy lượt đặt trước {Id}", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi hủy lượt đặt trước."));
            }
        }

        /// <summary>
        /// Hoàn thành lượt đặt trước (Thủ thư giao sách)
        /// </summary>
        [HttpPost("{id}/fulfill")]
        [RequirePermission(Permissions.ReservationApprove)]
        public async Task<IActionResult> Fulfill(string id)
        {
            try
            {
                var result = await _reservationService.FulfillReservationAsync(id);
                return Ok(ApiResponse<ReservationResponseDto>.SuccessResponse(result, "Đã hoàn thành lượt đặt trước."));
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
                _logger.LogError(ex, "Lỗi khi hoàn thành lượt đặt trước {Id}", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xử lý hoàn thành đặt trước."));
            }
        }
    }
}
