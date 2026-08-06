using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api.Modules.DigitalContent.DTOs;
using api.Modules.DigitalContent.Services;
using api.Common.Models;
using System.Security.Claims;
using api.Auth;
using api.Common.Constants;
namespace api.Modules.DigitalContent.Controllers
{
    [ApiController]
    [Route("api/books/{bookId}/chapters")]
    [Authorize]
    public class ChaptersController : ControllerBase
    {
        private readonly IChapterService _chapterService;
        private readonly ILogger<ChaptersController> _logger;

        public ChaptersController(IChapterService chapterService, ILogger<ChaptersController> logger)
        {
            _chapterService = chapterService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách chapter của sách
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetByBookId(string bookId)
        {
            try
            {
                var chapters = await _chapterService.GetByBookIdAsync(bookId);
                return Ok(ApiResponse<object>.SuccessResponse(
                    chapters,
                    "Chapters retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chapters for book {BookId}", bookId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving chapters"));
            }
        }

        /// <summary>
        /// Lấy thông tin chapter theo ID
        /// </summary>
        [HttpGet("{chapterId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(string bookId, string chapterId)
        {
            try
            {
                var chapter = await _chapterService.GetByIdAsync(bookId, chapterId);
                if (chapter == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Chapter not found"));

                return Ok(ApiResponse<object>.SuccessResponse(
                    chapter,
                    "Chapter retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chapter {ChapterId}", chapterId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving the chapter"));
            }
        }

        /// <summary>
        /// Lấy nội dung chapter
        /// </summary>
        [HttpGet("{chapterId}/content")]
        [AllowAnonymous]
        public async Task<IActionResult> GetContent(string bookId, string chapterId)
        {
            try
            {
                var content = await _chapterService.GetContentAsync(bookId, chapterId);
                if (content == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Chapter content not found"));

                return Ok(ApiResponse<ChapterContentDto>.SuccessResponse(
                    content,
                    "Chapter content retrieved successfully"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chapter content {ChapterId}", chapterId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while retrieving chapter content"));
            }
        }

        /// <summary>
        /// Tạo chapter mới
        /// </summary>
        [HttpPost]
        [RequirePermission("chapter.create")]
        public async Task<IActionResult> Create(string bookId, [FromBody] CreateChapterDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";

                var chapter = await _chapterService.CreateAsync(bookId, dto, userId);

                return CreatedAtAction(
                    nameof(GetById),
                    new { bookId, chapterId = chapter.ChapterId },
                    ApiResponse<object>.SuccessResponse(
                        chapter,
                        "Chapter created successfully",
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
                _logger.LogError(ex, "Error creating chapter for book {BookId}", bookId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while creating the chapter"));
            }
        }

        /// <summary>
        /// Cập nhật chapter
        /// </summary>
        [HttpPut("{chapterId}")]
        [RequirePermission("chapter.update")]
        public async Task<IActionResult> Update(string bookId, string chapterId, [FromBody] UpdateChapterDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var chapter = await _chapterService.UpdateAsync(bookId, chapterId, dto, userId);

                if (chapter == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Chapter not found"));

                return Ok(ApiResponse<object>.SuccessResponse(
                    chapter,
                    "Chapter updated successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating chapter {ChapterId}", chapterId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while updating the chapter"));
            }
        }

        /// <summary>
        /// Xuất bản chapter
        /// </summary>
        [HttpPatch("{chapterId}/publish")]
        [RequirePermission("chapter.publish")]
        public async Task<IActionResult> Publish(string bookId, string chapterId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var chapter = await _chapterService.PublishAsync(bookId, chapterId, userId);

                if (chapter == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Chapter not found"));

                return Ok(ApiResponse<object>.SuccessResponse(
                    chapter,
                    "Chapter published successfully"
                ));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing chapter {ChapterId}", chapterId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while publishing the chapter"));
            }
        }

        /// <summary>
        /// Xóa chapter (archive)
        /// </summary>
        [HttpDelete("{chapterId}")]
        [RequirePermission("chapter.delete")]
        public async Task<IActionResult> Delete(string bookId, string chapterId)
        {
            try
            {
                var result = await _chapterService.DeleteAsync(bookId, chapterId);
                if (!result)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Chapter not found"));

                return Ok(ApiResponse.SuccessResponse("Chapter archived successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting chapter {ChapterId}", chapterId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while deleting the chapter"));
            }
        }

        /// <summary>
        /// Đổi thứ tự các chapter
        /// </summary>
        [HttpPatch("reorder")]
        [RequirePermission("chapter.update")]
        public async Task<IActionResult> ReorderChapters(string bookId, [FromBody] List<string> orderedChapterIds)
        {
            try
            {
                if (orderedChapterIds == null || !orderedChapterIds.Any())
                {
                    return BadRequest(ApiResponse<object>.ErrorResponse(400, "Chapter list cannot be empty"));
                }

                var result = await _chapterService.ReorderChaptersAsync(bookId, orderedChapterIds);
                if (!result)
                    return BadRequest(ApiResponse<object>.ErrorResponse(400, "Invalid chapter list"));

                return Ok(ApiResponse.SuccessResponse("Chapters reordered successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reordering chapters for book {BookId}", bookId);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "An error occurred while reordering chapters"));
            }
        }
    }
}
