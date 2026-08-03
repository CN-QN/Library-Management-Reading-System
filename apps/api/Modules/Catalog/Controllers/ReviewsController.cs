using System.Security.Claims;
using api.Auth;
using api.Common.Models;
using api.Modules.Catalog.DTOs;
using api.Modules.Catalog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Catalog.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(IReviewService reviewService, ILogger<ReviewsController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách đánh giá của sách (lọc theo số sao, sắp xếp và phân trang)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetReviews(
            [FromQuery] string bookId,
            [FromQuery] int? ratingFilter,
            [FromQuery] string sortBy = "newest",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(bookId))
                    return BadRequest(ApiResponse<object>.ErrorResponse(400, "Vui lòng cung cấp mã sách (bookId)."));

                var result = await _reviewService.GetReviewsAsync(bookId, ratingFilter, sortBy, page, pageSize);
                return Ok(ApiResponse<PagedResult<ReviewResponseDto>>.SuccessResponse(result, "Lấy danh sách đánh giá thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách đánh giá cho sách {BookId}.", bookId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy đánh giá."));
            }
        }

        /// <summary>
        /// Thống kê đánh giá của sách (điểm trung bình, số lượng và phân bổ số sao)
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetReviewStats([FromQuery] string bookId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(bookId))
                    return BadRequest(ApiResponse<object>.ErrorResponse(400, "Vui lòng cung cấp mã sách (bookId)."));

                var stats = await _reviewService.GetReviewStatsAsync(bookId);
                return Ok(ApiResponse<ReviewStatsDto>.SuccessResponse(stats, "Lấy thống kê đánh giá thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thống kê đánh giá cho sách {BookId}.", bookId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy thống kê đánh giá."));
            }
        }

        /// <summary>
        /// Lấy bài đánh giá của chính người dùng hiện tại đối với cuốn sách
        /// </summary>
        [HttpGet("mine")]
        [Authorize]
        public async Task<IActionResult> GetMyReview([FromQuery] string bookId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Bạn chưa đăng nhập."));

                var review = await _reviewService.GetUserReviewAsync(bookId, userId);
                return Ok(ApiResponse<ReviewResponseDto?>.SuccessResponse(review, "Lấy đánh giá cá nhân thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy đánh giá cá nhân.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy đánh giá cá nhân."));
            }
        }

        /// <summary>
        /// Đăng bài đánh giá mới (Yêu cầu đăng nhập)
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Bạn cần đăng nhập để gửi đánh giá."));

                var review = await _reviewService.CreateReviewAsync(userId, dto);
                return CreatedAtAction(nameof(GetReviews), new { bookId = dto.BookId }, ApiResponse<ReviewResponseDto>.SuccessResponse(review, "Gửi đánh giá thành công."));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo đánh giá.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi tạo đánh giá."));
            }
        }

        /// <summary>
        /// Chỉnh sửa bài đánh giá đã có (Tác giả bài viết)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(string id, [FromBody] UpdateReviewDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Bạn chưa đăng nhập."));

                var review = await _reviewService.UpdateReviewAsync(id, userId, dto);
                if (review == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy bài đánh giá."));

                return Ok(ApiResponse<ReviewResponseDto>.SuccessResponse(review, "Cập nhật đánh giá thành công."));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ApiResponse<object>.ErrorResponse(403, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật đánh giá {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi cập nhật đánh giá."));
            }
        }

        /// <summary>
        /// Xóa bài đánh giá (Tác giả bài viết hoặc Admin)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(string id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Bạn chưa đăng nhập."));

                var isAdmin = User.IsInRole("SUPER_ADMIN") || User.IsInRole("LIBRARY_ADMIN");
                var success = await _reviewService.DeleteReviewAsync(id, userId, isAdmin);

                if (!success)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy bài đánh giá để xóa."));

                return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Xóa bài đánh giá thành công."));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ApiResponse<object>.ErrorResponse(403, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa bài đánh giá {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xóa đánh giá."));
            }
        }

        /// <summary>
        /// Duyệt hoặc ẩn bài đánh giá (Yêu cầu quyền review.moderate)
        /// </summary>
        [HttpPatch("{id}/status")]
        [RequirePermission("review.moderate")]
        public async Task<IActionResult> ModerateReview(string id, [FromQuery] string status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status))
                    return BadRequest(ApiResponse<object>.ErrorResponse(400, "Vui lòng truyền trạng thái (APPROVED, HIDDEN, REJECTED)."));

                var success = await _reviewService.ModerateReviewAsync(id, status.ToUpper());
                if (!success)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy bài đánh giá."));

                return Ok(ApiResponse<object>.SuccessResponse(new { id, status }, "Cập nhật trạng thái đánh giá thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi duyệt bài đánh giá {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi duyệt đánh giá."));
            }
        }

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("id")?.Value
                ?? string.Empty;
        }
    }
}
