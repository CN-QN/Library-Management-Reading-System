using api.Common.Models;
using api.Database.Entities;
using api.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Catalog.Controllers
{
    /// <summary>
    /// API danh sách danh mục sách (Category)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly ILogger<CategoriesController> _logger;

        public CategoriesController(ICategoryRepository categoryRepository, ILogger<CategoriesController> logger)
        {
            _categoryRepository = categoryRepository;
            _logger = logger;
        }

        /// <summary>
        /// Lấy toàn bộ danh sách category (có thể lọc theo parentId để lấy cây danh mục)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? parentId)
        {
            try
            {
                List<Category> categories;

                if (!string.IsNullOrEmpty(parentId))
                {
                    // Lấy danh mục con theo parentId
                    categories = await _categoryRepository.GetChildrenAsync(parentId);
                }
                else
                {
                    // Lấy tất cả danh mục
                    categories = await _categoryRepository.GetAllAsync();
                }

                var result = categories
                    .Where(c => c.Status == "ACTIVE")
                    .Select(c => new
                    {
                        c.Id,
                        c.Name,
                        c.Slug,
                        c.ParentId,
                        c.Path,
                        c.Status
                    })
                    .OrderBy(c => c.Name)
                    .ToList();

                return Ok(ApiResponse<object>.SuccessResponse(result, $"Lấy danh sách {result.Count} danh mục thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách danh mục.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy danh mục."));
            }
        }

        /// <summary>
        /// Lấy chi tiết category theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var category = await _categoryRepository.GetByIdAsync(id);
                if (category == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy danh mục."));

                var children = await _categoryRepository.GetChildrenAsync(id);

                return Ok(ApiResponse<object>.SuccessResponse(new
                {
                    category.Id,
                    category.Name,
                    category.Slug,
                    category.ParentId,
                    category.Path,
                    category.Status,
                    Children = children.Select(c => new { c.Id, c.Name, c.Slug })
                }, "Lấy thông tin danh mục thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy chi tiết danh mục {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy danh mục."));
            }
        }
    }
}
