using api.Common.Models;
using api.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Catalog.Controllers
{
    /// <summary>
    /// API tìm kiếm sách nâng cao với filter metadata cho sidebar
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly IBookRepository _bookRepository;
        private readonly ILogger<SearchController> _logger;

        public SearchController(
            IBookRepository bookRepository,
            ILogger<SearchController> logger)
        {
            _bookRepository = bookRepository;
            _logger = logger;
        }

        /// <summary>
        /// Trả về metadata cho sidebar filter:
        /// - Danh sách category (active)
        /// - Danh sách tác giả
        /// - Các loại sắp xếp hợp lệ
        /// - Các giá trị Availability hợp lệ
        /// - Số lượng sách theo trạng thái
        /// </summary>
        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters()
        {
            try
            {
                var books = await _bookRepository.GetAllAsync();
                
                var categories = books.SelectMany(b => b.Categories)
                    .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                    .GroupBy(c => c.Name.ToLowerInvariant().Trim())
                    .Select(g => g.First())
                    .OrderBy(c => c.Name)
                    .ToList();
                
                var authors = books.SelectMany(b => b.Authors)
                    .Where(a => !string.IsNullOrWhiteSpace(a.Name))
                    .GroupBy(a => string.IsNullOrWhiteSpace(a.Slug) ? a.Name.ToLowerInvariant().Trim() : a.Slug.ToLowerInvariant().Trim())
                    .Select(g => g.First())
                    .OrderBy(a => a.Name)
                    .ToList();

                var publishedCount = await _bookRepository.CountByStatusAsync("PUBLISHED");

                var result = new
                {
                    Categories = categories
                        .Select(c => new { Id = c.CategoryId, c.Name, c.Slug, ParentId = (string?)null })
                        .ToList(),

                    Authors = authors
                        .Select(a => new { Id = a.AuthorId, a.Name, a.Slug })
                        .ToList(),

                    SortOptions = new[]
                    {
                        new { Value = "createdAt", Label = "Mới nhất" },
                        new { Value = "title",     Label = "Tên sách (A-Z)" },
                        new { Value = "viewcount", Label = "Lượt xem nhiều nhất" },
                        new { Value = "rating",    Label = "Đánh giá cao nhất" }
                    },

                    SortOrders = new[]
                    {
                        new { Value = "desc", Label = "Giảm dần" },
                        new { Value = "asc",  Label = "Tăng dần" }
                    },

                    AvailabilityOptions = new[]
                    {
                        new { Value = (string?)null,          Label = "Tất cả" },
                        new { Value = (string?)"AVAILABLE",   Label = "Còn bản sao" },
                        new { Value = (string?)"UNAVAILABLE", Label = "Hết bản sao" }
                    },

                    AccessTypes = new[]
                    {
                        new { Value = (string?)null,      Label = "Tất cả" },
                        new { Value = (string?)"FREE",    Label = "Miễn phí" },
                        new { Value = (string?)"PREMIUM", Label = "Trả phí" }
                    },

                    Stats = new
                    {
                        TotalPublished = publishedCount
                    }
                };

                return Ok(ApiResponse<object>.SuccessResponse(result, "Lấy metadata filter thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy filter metadata.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy dữ liệu filter."));
            }
        }
    }
}
