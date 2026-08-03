using System.Security.Claims;
using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Modules.Circulation.DTOs;
using api.Modules.Circulation.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Circulation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BorrowingsController : ControllerBase
    {
        private readonly IBorrowingService _borrowingService;
        private readonly ILogger<BorrowingsController> _logger;

        public BorrowingsController(IBorrowingService borrowingService, ILogger<BorrowingsController> logger)
        {
            _borrowingService = borrowingService;
            _logger = logger;
        }

        /// <summary>
        /// Tạo phiếu mượn sách mới tại quầy thủ thư
        /// </summary>
        [HttpPost]
        [RequirePermission(Permissions.LoanCreate)]
        public async Task<IActionResult> Create([FromBody] CreateBorrowingDto dto)
        {
            try
            {
                var actorUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _borrowingService.CreateBorrowingAsync(dto, actorUserId);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = result.Id },
                    ApiResponse<BorrowingResponseDto>.SuccessResponse(result, "Tạo phiếu mượn sách thành công.", null, 201)
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
                _logger.LogError(ex, "Lỗi xảy ra khi tạo phiếu mượn sách");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Đã xảy ra lỗi hệ thống khi xử lý mượn sách."));
            }
        }

        /// <summary>
        /// Danh sách phiếu mượn (phân trang, lọc theo user, chi nhánh, trạng thái)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetList(
            [FromQuery] string? userId,
            [FromQuery] string? branchId,
            [FromQuery] string? status,
            [FromQuery] string? keyword,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10)
        {
            try
            {
                var (items, total) = await _borrowingService.GetBorrowingsAsync(userId, branchId, status, keyword, page, Math.Min(limit, 100));
                
                var pagedResult = new PagedResult<BorrowingResponseDto>(items, page, limit, total);
                return Ok(ApiResponse<PagedResult<BorrowingResponseDto>>.SuccessResponse(
                    pagedResult,
                    "Lấy danh sách phiếu mượn thành công.",
                    new { page, limit, total }
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra khi tra cứu danh sách phiếu mượn");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi tra cứu phiếu mượn."));
            }
        }

        /// <summary>
        /// Lấy chi tiết phiếu mượn theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var result = await _borrowingService.GetBorrowingByIdAsync(id);
                if (result == null)
                {
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy phiếu mượn sách."));
                }

                return Ok(ApiResponse<BorrowingResponseDto>.SuccessResponse(result, "Lấy chi tiết phiếu mượn thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra khi lấy chi tiết phiếu mượn {Id}", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy thông tin phiếu mượn."));
            }
        }

        /// <summary>
        /// Trả sách mượn tại quầy thủ thư
        /// </summary>
        [HttpPost("{id}/return")]
        [RequirePermission(Permissions.LoanReturn)]
        public async Task<IActionResult> ReturnItems(string id, [FromBody] ReturnItemsDto dto)
        {
            try
            {
                var result = await _borrowingService.ReturnBorrowingItemsAsync(id, dto);
                return Ok(ApiResponse<BorrowingResponseDto>.SuccessResponse(result, "Trả sách thành công."));
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
                _logger.LogError(ex, "Lỗi xảy ra khi làm thủ tục trả sách cho phiếu mượn {Id}", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xử lý trả sách."));
            }
        }

        /// <summary>
        /// Gia hạn mượn sách
        /// </summary>
        [HttpPost("items/{itemId}/renew")]
        public async Task<IActionResult> RenewItem(string itemId, [FromBody] RenewItemDto dto)
        {
            try
            {
                var result = await _borrowingService.RenewBorrowingItemAsync(itemId, dto);
                return Ok(ApiResponse<BorrowingItemResponseDto>.SuccessResponse(result, "Gia hạn mượn sách thành công."));
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
                _logger.LogError(ex, "Lỗi xảy ra khi gia hạn bản ghi mượn sách {ItemId}", itemId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi gia hạn sách."));
            }
        }

        /// <summary>
        /// Báo sách bị hỏng hoặc mất
        /// </summary>
        [HttpPatch("items/{itemId}/status")]
        [RequirePermission(Permissions.LoanReturn)]
        public async Task<IActionResult> MarkItemStatus(string itemId, [FromBody] MarkItemStatusDto dto)
        {
            try
            {
                var actorUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _borrowingService.MarkItemStatusAsync(itemId, dto, actorUserId);
                return Ok(ApiResponse<BorrowingItemResponseDto>.SuccessResponse(result, $"Đã cập nhật trạng thái sách thành {dto.Status}."));
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
                _logger.LogError(ex, "Lỗi xảy ra khi cập nhật trạng thái sách hỏng/mất {ItemId}", itemId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xử lý báo hỏng/mất sách."));
            }
        }
    }
}
