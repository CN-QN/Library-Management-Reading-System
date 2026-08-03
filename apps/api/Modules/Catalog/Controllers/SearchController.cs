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
        private readonly ICategoryRepository _categoryRepository;
        private readonly IAuthorRepository _authorRepository;
        private readonly IBookRepository _bookRepository;
        private readonly ILogger<SearchController> _logger;

        public SearchController(
            ICategoryRepository categoryRepository,
            IAuthorRepository authorRepository,
            IBookRepository bookRepository,
            ILogger<SearchController> logger)
        {
            _categoryRepository = categoryRepository;
            _authorRepository = authorRepository;
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
                var categories = await _categoryRepository.GetAllAsync();
                var authors = await _authorRepository.GetAllAsync();

                var publishedCount = await _bookRepository.CountByStatusAsync("PUBLISHED");

                var result = new
                {
                    Categories = categories
                        .Where(c => c.Status == "ACTIVE")
                        .Select(c => new { c.Id, c.Name, c.Slug, c.ParentId })
                        .OrderBy(c => c.Name)
                        .ToList(),

                    Authors = authors
                        .Select(a => new { a.Id, a.Name, a.Slug })
                        .OrderBy(a => a.Name)
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
