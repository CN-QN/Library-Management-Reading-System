using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Modules.Borrowings.DTOs;
using api.Modules.Borrowings.Services;
using api.Common.Models;
using System.Security.Claims;
using LibraryManagement.Shared.Attributes;
using MongoDB.Bson;

namespace api.Modules.Borrowings.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BorrowingsController : ControllerBase
    {
        private readonly IBorrowingService _borrowingService;
        private readonly ILogger<BorrowingsController> _logger;

        public BorrowingsController(
            IBorrowingService borrowingService,
            ILogger<BorrowingsController> logger)
        {
            _borrowingService = borrowingService;
            _logger = logger;
        }

        /// <summary>
        /// Mượn sách
        /// </summary>
        [HttpPost]
        [RequirePermission("borrowing.create")]
        public async Task<IActionResult> BorrowBook([FromBody] BorrowRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _borrowingService.BorrowBookAsync(request, userId);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = result.Id },
                    ApiResponse<BorrowResponseDto>.SuccessResponse(
                        result,
                        "Book borrowed successfully",
                        null,
                        201
                    )
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error borrowing book");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while borrowing the book"));
            }
        }

        /// <summary>
        /// Lấy danh sách mượn sách
        /// </summary>
        [HttpGet]
        [RequirePermission("borrowing.view")]
        public async Task<IActionResult> GetBorrowings([FromQuery] BorrowQueryDto query)
        {
            try
            {
                var result = await _borrowingService.GetBorrowingsAsync(query);
                return Ok(ApiResponse<PagedResult<BorrowResponseDto>>.SuccessResponse(
                    result,
                    "Borrowings retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting borrowings");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving borrowings"));
            }
        }

        /// <summary>
        /// Lấy thông tin mượn theo ID
        /// </summary>
        [HttpGet("{id}")]
        [RequirePermission("borrowing.view")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var record = await _borrowingService.GetByIdAsync(id);
                if (record == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Borrowing record not found"));

                return Ok(ApiResponse<BorrowResponseDto>.SuccessResponse(
                    record,
                    "Borrowing record retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting borrowing record {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving the record"));
            }
        }

        /// <summary>
        /// Lấy danh sách mượn của user hiện tại
        /// </summary>
        [HttpGet("my-borrowings")]
        public async Task<IActionResult> GetMyBorrowings()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "User not authenticated"));

                var records = await _borrowingService.GetByUserIdAsync(userId);
                return Ok(ApiResponse<List<BorrowResponseDto>>.SuccessResponse(
                    records,
                    "Your borrowings retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user borrowings");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving your borrowings"));
            }
        }

        /// <summary>
        /// Lấy danh sách mượn quá hạn
        /// </summary>
        [HttpGet("overdue")]
        [RequirePermission("borrowing.manage")]
        public async Task<IActionResult> GetOverdue()
        {
            try
            {
                var records = await _borrowingService.GetOverdueBorrowingsAsync();
                return Ok(ApiResponse<List<BorrowResponseDto>>.SuccessResponse(
                    records,
                    "Overdue borrowings retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting overdue borrowings");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving overdue borrowings"));
            }
        }

        /// <summary>
        /// Lấy danh sách mượn đang hoạt động
        /// </summary>
        [HttpGet("active")]
        [RequirePermission("borrowing.view")]
        public async Task<IActionResult> GetActive()
        {
            try
            {
                var records = await _borrowingService.GetActiveBorrowingsAsync();
                return Ok(ApiResponse<List<BorrowResponseDto>>.SuccessResponse(
                    records,
                    "Active borrowings retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active borrowings");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving active borrowings"));
            }
        }

        /// <summary>
        /// Trả sách
        /// </summary>
        [HttpPatch("{id}/return")]
        [RequirePermission("borrowing.update")]
        public async Task<IActionResult> ReturnBook(string id, [FromBody] ReturnRequestDto? request = null)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                request ??= new ReturnRequestDto();
                
                var result = await _borrowingService.ReturnBookAsync(id, request, userId);

                return Ok(ApiResponse<BorrowResponseDto>.SuccessResponse(
                    result,
                    "Book returned successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error returning book {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while returning the book"));
            }
        }

        /// <summary>
        /// Gia hạn mượn sách
        /// </summary>
        [HttpPatch("{id}/renew")]
        [RequirePermission("borrowing.update")]
        public async Task<IActionResult> RenewBook(string id, [FromBody] RenewRequestDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _borrowingService.RenewBookAsync(id, request, userId);

                return Ok(ApiResponse<BorrowResponseDto>.SuccessResponse(
                    result,
                    "Book renewed successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error renewing book {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while renewing the book"));
            }
        }

        /// <summary>
        /// Tính tiền phạt cho mượn quá hạn
        /// </summary>
        [HttpGet("{id}/calculate-fine")]
        [RequirePermission("borrowing.view")]
        public async Task<IActionResult> CalculateFine(string id)
        {
            try
            {
                var fine = await _borrowingService.CalculateFineAsync(id);
                return Ok(new { borrowingId = id, fineAmount = fine, currency = "VND" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error calculating fine for {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while calculating fine"));
            }
        }

        /// <summary>
        /// Thanh toán tiền phạt
        /// </summary>
        [HttpPatch("{id}/pay-fine")]
        [RequirePermission("borrowing.update")]
        public async Task<IActionResult> PayFine(string id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _borrowingService.PayFineAsync(id, userId);

                if (!result)
                    return BadRequest(ApiResponse<object>.ErrorResponse(400, "No fine to pay or record not found"));

                return Ok(ApiResponse.SuccessResponse("Fine paid successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error paying fine for {id}");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while paying fine"));
            }
        }

        /// <summary>
        /// Kiểm tra user có thể mượn thêm sách không
        /// </summary>
        [HttpGet("can-borrow")]
        public async Task<IActionResult> CanBorrow([FromQuery] int maxLimit = 5)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "User not authenticated"));

                var canBorrow = await _borrowingService.CanUserBorrowAsync(userId, maxLimit);
                return Ok(new { canBorrow, maxLimit, message = canBorrow ? "User can borrow more books" : "User has reached maximum limit" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking borrowing limit");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while checking borrowing limit"));
            }
        }
    }
}