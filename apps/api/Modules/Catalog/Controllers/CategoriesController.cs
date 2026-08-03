using System.Text.RegularExpressions;
using api.Auth;
using api.Common.Models;
using api.Database.Entities;
using api.Modules.Catalog.DTOs;
using api.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Catalog.Controllers
{
    /// <summary>
    /// API danh sách và quản lý danh mục sách (Category)
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
                        c.Description,
                        c.ParentId,
                        c.Path,
                        c.Status,
                        c.DisplayOrder
                    })
                    .OrderBy(c => c.DisplayOrder)
                    .ThenBy(c => c.Name)
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
                    category.Description,
                    category.ParentId,
                    category.Path,
                    category.Status,
                    category.DisplayOrder,
                    Children = children.Select(c => new { c.Id, c.Name, c.Slug })
                }, "Lấy thông tin danh mục thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy chi tiết danh mục {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi lấy danh mục."));
            }
        }

        /// <summary>
        /// Tạo mới danh mục (Yêu cầu quyền book.create)
        /// </summary>
        [HttpPost]
        [RequirePermission("book.create")]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
        {
            try
            {
                var slug = GenerateSlug(dto.Name);
                if (await _categoryRepository.ExistsBySlugAsync(slug))
                {
                    slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";
                }

                var category = new Category
                {
                    Name = dto.Name.Trim(),
                    Slug = slug,
                    Description = dto.Description,
                    ParentId = dto.ParentId,
                    Status = dto.Status ?? "ACTIVE",
                    DisplayOrder = dto.DisplayOrder,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _categoryRepository.InsertAsync(category);
                _logger.LogInformation("Created new category: {CategoryName} (ID: {CategoryId})", category.Name, category.Id);

                return CreatedAtAction(nameof(GetById), new { id = category.Id }, ApiResponse<Category>.SuccessResponse(category, "Tạo danh mục mới thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo danh mục.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi tạo danh mục."));
            }
        }

        /// <summary>
        /// Cập nhật danh mục (Yêu cầu quyền book.update)
        /// </summary>
        [HttpPut("{id}")]
        [RequirePermission("book.update")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateCategoryDto dto)
        {
            try
            {
                var category = await _categoryRepository.GetByIdAsync(id);
                if (category == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy danh mục để cập nhật."));

                category.Name = dto.Name.Trim();
                category.Description = dto.Description;
                category.ParentId = dto.ParentId;
                category.Status = dto.Status ?? "ACTIVE";
                category.DisplayOrder = dto.DisplayOrder;
                category.UpdatedAt = DateTime.UtcNow;

                await _categoryRepository.UpdateAsync(id, category);
                _logger.LogInformation("Updated category: {CategoryId}", id);

                return Ok(ApiResponse<Category>.SuccessResponse(category, "Cập nhật danh mục thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật danh mục {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi cập nhật danh mục."));
            }
        }

        /// <summary>
        /// Xóa danh mục (Yêu cầu quyền book.delete)
        /// </summary>
        [HttpDelete("{id}")]
        [RequirePermission("book.delete")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var category = await _categoryRepository.GetByIdAsync(id);
                if (category == null)
                    return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy danh mục để xóa."));

                await _categoryRepository.DeleteAsync(id);
                _logger.LogInformation("Deleted category: {CategoryId}", id);

                return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Xóa danh mục thành công."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa danh mục {Id}.", id);
                return StatusCode(500, ApiResponse<object>.ErrorResponse(500, "Lỗi hệ thống khi xóa danh mục."));
            }
        }

        private static string GenerateSlug(string text)
        {
            string str = text.ToLowerInvariant();

            string[] vietnameseSigns = new string[]
            {
                "aàảãáạăằẳẵắặâầẩẫấậ", "dđ", "eèẻẽéẹêềểễếệ",
                "iìỉĩíị", "oòỏõóọôồổỗốộơờởỡớợ",
                "uùủũúụưừửữứự", "yỳỷỹýỵ"
            };

            for (int i = 1; i < vietnameseSigns.Length; i++)
            {
                for (int j = 0; j < vietnameseSigns[i].Length; j++)
                {
                    str = str.Replace(vietnameseSigns[i][j], vietnameseSigns[i][0]);
                }
            }

            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            str = Regex.Replace(str, @"\s+", " ").Trim();
            str = Regex.Replace(str, @"\s", "-");

            return string.IsNullOrWhiteSpace(str) ? "category" : str;
        }
    }
}
