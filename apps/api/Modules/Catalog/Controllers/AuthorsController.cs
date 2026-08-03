using api.Auth;
using api.Common.Models;
using api.Modules.Catalog.DTOs;
using api.Modules.Catalog.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Catalog.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthorsController : ControllerBase
    {
        private readonly IAuthorService _authorService;
        private readonly ILogger<AuthorsController> _logger;

        public AuthorsController(IAuthorService authorService, ILogger<AuthorsController> logger)
        {
            _authorService = authorService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tác giả (có tìm kiếm và phân trang)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAuthors([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _authorService.GetAuthorsAsync(search, page, pageSize);
                return Ok(ApiResponse<PagedResult<AuthorResponseDto>>.SuccessResponse(result, "Lấy danh sách tác giả thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách tác giả.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy danh sách tác giả."));
            }
        }

        /// <summary>
        /// Lấy chi tiết tác giả theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAuthorById(string id)
        {
            try
            {
                var author = await _authorService.GetAuthorByIdAsync(id);
                if (author == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy tác giả."));

                return Ok(ApiResponse<AuthorResponseDto>.SuccessResponse(author, "Lấy thông tin tác giả thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin tác giả {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy tác giả."));
            }
        }

        /// <summary>
        /// Tạo mới tác giả (Yêu cầu quyền book.create)
        /// </summary>
        [HttpPost]
        [RequirePermission("book.create")]
        public async Task<IActionResult> CreateAuthor([FromBody] CreateAuthorDto dto)
        {
            try
            {
                var author = await _authorService.CreateAuthorAsync(dto);
                return CreatedAtAction(nameof(GetAuthorById), new { id = author.Id }, ApiResponse<AuthorResponseDto>.SuccessResponse(author, "Tạo tác giả mới thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo tác giả.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi tạo tác giả."));
            }
        }

        /// <summary>
        /// Cập nhật thông tin tác giả (Yêu cầu quyền book.update)
        /// </summary>
        [HttpPut("{id}")]
        [RequirePermission("book.update")]
        public async Task<IActionResult> UpdateAuthor(string id, [FromBody] UpdateAuthorDto dto)
        {
            try
            {
                var author = await _authorService.UpdateAuthorAsync(id, dto);
                if (author == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy tác giả để cập nhật."));

                return Ok(ApiResponse<AuthorResponseDto>.SuccessResponse(author, "Cập nhật tác giả thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật tác giả {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi cập nhật tác giả."));
            }
        }

        /// <summary>
        /// Xóa tác giả (Yêu cầu quyền book.delete)
        /// </summary>
        [HttpDelete("{id}")]
        [RequirePermission("book.delete")]
        public async Task<IActionResult> DeleteAuthor(string id)
        {
            try
            {
                var success = await _authorService.DeleteAuthorAsync(id);
                if (!success)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy tác giả để xóa."));

                return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Xóa tác giả thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa tác giả {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xóa tác giả."));
            }
        }
    }
}
