using System.Security.Claims;
using api.Common.Models;
using api.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Reading.Controllers
{
    /// <summary>
    /// API quản lý tiến trình đọc sách của người dùng
    /// </summary>
    [ApiController]
    [Route("api/Reading")]
    [Authorize]
    public class ReadingProgressController : ControllerBase
    {
        private readonly IReadingProgressRepository _progressRepository;
        private readonly IBookRepository _bookRepository;
        private readonly ILogger<ReadingProgressController> _logger;

        public ReadingProgressController(
            IReadingProgressRepository progressRepository,
            IBookRepository bookRepository,
            ILogger<ReadingProgressController> logger)
        {
            _progressRepository = progressRepository;
            _bookRepository = bookRepository;
            _logger = logger;
        }

        /// <summary>
        /// GET /api/Reading/progress
        /// Lấy danh sách tiến trình đọc của user hiện tại (bao gồm thông tin sách)
        /// </summary>
        [HttpGet("progress")]
        public async Task<IActionResult> GetMyProgress()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được người dùng."));

                var progressList = await _progressRepository.GetByUserIdAsync(userId);

                // Enrich với thông tin sách
                var result = new List<object>();
                foreach (var p in progressList)
                {
                    var book = await _bookRepository.GetByIdAsync(p.BookId);
                    result.Add(new
                    {
                        p.Id,
                        p.BookId,
                        BookTitle  = book?.Title,
                        BookSlug   = book?.Slug,
                        p.ChapterId,
                        p.ChapterNumber,
                        p.ScrollPosition,
                        p.Percentage,
                        p.Status,
                        p.LastReadAt,
                        p.Version
                    });
                }

                return Ok(ApiResponse<object>.SuccessResponse(result,
                    $"Lấy danh sách tiến trình đọc thành công ({result.Count} cuốn)."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy tiến trình đọc.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy tiến trình đọc."));
            }
        }

        /// <summary>
        /// GET /api/Reading/progress/{bookId}
        /// Lấy tiến trình đọc của user hiện tại cho một cuốn sách cụ thể
        /// </summary>
        [HttpGet("progress/{bookId}")]
        public async Task<IActionResult> GetProgressByBook(string bookId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được người dùng."));

                var progress = await _progressRepository.GetByUserIdAndBookIdAsync(userId, bookId);
                if (progress == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Chưa có tiến trình đọc cho sách này."));

                var book = await _bookRepository.GetByIdAsync(bookId);

                return Ok(ApiResponse<object>.SuccessResponse(new
                {
                    progress.Id,
                    progress.BookId,
                    BookTitle     = book?.Title,
                    BookSlug      = book?.Slug,
                    progress.ChapterId,
                    progress.ChapterNumber,
                    progress.ScrollPosition,
                    progress.Percentage,
                    progress.Status,
                    progress.LastReadAt,
                    progress.Version
                }, "Lấy tiến trình đọc thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy tiến trình đọc sách {BookId}.", bookId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy tiến trình đọc."));
            }
        }
    }
}
