using System.Security.Claims;
using api.Common.Models;
using api.Repositories.Interfaces;
using api.Modules.Reading.Services;
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
        private readonly IReadingProgressService _progressService;
        private readonly IBookRepository _bookRepository;
        private readonly api.Modules.DigitalContent.Services.IRedisReadingBufferService _redisBufferService;
        private readonly ILogger<ReadingProgressController> _logger;

        public ReadingProgressController(
            IReadingProgressRepository progressRepository,
            IReadingProgressService progressService,
            IBookRepository bookRepository,
            api.Modules.DigitalContent.Services.IRedisReadingBufferService redisBufferService,
            ILogger<ReadingProgressController> logger)
        {
            _progressRepository = progressRepository;
            _progressService = progressService;
            _bookRepository = bookRepository;
            _redisBufferService = redisBufferService;
            _logger = logger;
        }

        /// <summary>
        /// POST /api/Reading/progress/buffer
        /// Ghi tạm tiến độ đọc sách vào Redis RAM Buffer với độ trễ < 1ms
        /// </summary>
        [HttpPost("progress/buffer")]
        public async Task<IActionResult> SaveToRedisBuffer([FromBody] api.Modules.DigitalContent.Services.ReadingProgressBufferDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Chưa xác thực"));

            await _redisBufferService.SaveProgressToBufferAsync(userId, dto.BookId, dto);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Đã lưu tạm tiến độ vào Redis RAM (< 1ms)"));
        }

        /// <summary>
        /// POST /api/Reading/progress/flush
        /// Flush đồng bộ bản ghi mới nhất từ Redis RAM xuống MongoDB
        /// </summary>
        [HttpPost("progress/flush")]
        public async Task<IActionResult> FlushBufferToMongo([FromBody] api.Modules.DigitalContent.Services.ReadingProgressBufferDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Chưa xác thực"));

            var flushed = await _redisBufferService.FlushBufferToMongoAsync(userId, dto.BookId);
            return Ok(ApiResponse<object>.SuccessResponse(new { flushed }, "Đã đồng bộ tiến độ từ Redis RAM xuống MongoDB"));
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
                        BookCoverImage = book?.CoverAssetId,
                        AuthorName = book?.Authors != null && book.Authors.Any() ? string.Join(", ", book.Authors.Select(a => a.Name)) : "Nhiều tác giả",
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

                var bufferedProgress = await _redisBufferService.GetProgressFromBufferAsync(userId, bookId);
                var book = await _bookRepository.GetByIdAsync(bookId);

                if (bufferedProgress != null)
                {
                    return Ok(ApiResponse<object>.SuccessResponse(new
                    {
                        Id = $"buffer_{bookId}",
                        BookId = bookId,
                        BookTitle = book?.Title,
                        BookSlug = book?.Slug,
                        BookCoverImage = book?.CoverAssetId,
                        AuthorName = book?.Authors != null && book.Authors.Any() ? string.Join(", ", book.Authors.Select(a => a.Name)) : "Nhiều tác giả",
                        ChapterId = bufferedProgress.ChapterId,
                        ChapterNumber = bufferedProgress.ChapterNumber,
                        ScrollPosition = bufferedProgress.ScrollPosition,
                        Percentage = bufferedProgress.Percentage,
                        Status = "READING",
                        LastReadAt = bufferedProgress.LastReadAt,
                        Version = 1
                    }, "Lấy tiến trình đọc từ Redis RAM Buffer (< 1ms)."));
                }

                var progress = await _progressService.GetProgressAsync(userId, bookId);
                if (progress == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Chưa có tiến trình đọc cho sách này."));

                return Ok(ApiResponse<object>.SuccessResponse(new
                {
                    progress.Id,
                    progress.BookId,
                    BookTitle     = book?.Title,
                    BookSlug      = book?.Slug,
                    BookCoverImage = book?.CoverAssetId,
                    AuthorName    = book?.Authors != null && book.Authors.Any() ? string.Join(", ", book.Authors.Select(a => a.Name)) : "Nhiều tác giả",
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

        /// <summary>
        /// DELETE /api/Reading/progress/{bookId}
        /// Xóa tiến trình đọc của user hiện tại cho một cuốn sách cụ thể
        /// </summary>
        [HttpDelete("progress/{bookId}")]
        public async Task<IActionResult> DeleteProgress(string bookId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Không xác định được người dùng."));

                await _progressService.DeleteProgressAsync(userId, bookId);
                return Ok(ApiResponse<object>.SuccessResponse(null, "Xóa tiến trình đọc thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa tiến trình đọc sách {BookId}.", bookId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xóa tiến trình đọc."));
            }
        }

        /// <summary>
        /// GET /api/Reading/user/{userId}
        /// Lấy lịch sử đọc sách của người dùng theo UserId (Cho Admin)
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserReadingHistory(string userId)
        {
            try
            {
                var progressList = await _progressRepository.GetByUserIdAsync(userId);
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
                        BookCoverImage = book?.CoverAssetId,
                        AuthorName = book?.Authors != null && book.Authors.Any() ? string.Join(", ", book.Authors.Select(a => a.Name)) : "Nhiều tác giả",
                        p.ChapterId,
                        p.ChapterNumber,
                        p.ScrollPosition,
                        p.Percentage,
                        p.Status,
                        p.LastReadAt,
                        p.Version
                    });
                }

                return Ok(ApiResponse<object>.SuccessResponse(result, $"Lấy lịch sử đọc của người dùng thành công ({result.Count} cuốn)."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy lịch sử đọc cho user {UserId}.", userId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy lịch sử đọc."));
            }
        }
    }
}
