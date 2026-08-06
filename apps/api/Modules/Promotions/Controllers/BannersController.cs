using api.Common.Models;
using api.Database;
using api.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace api.Modules.Promotions.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BannersController : ControllerBase
{
    private readonly MongoDbContext _context;

    public BannersController(MongoDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách Banner active (Cho Trang chủ & Admin)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList()
    {
        var items = await _context.Banners.Find(Builders<Banner>.Filter.Empty)
            .SortBy(b => b.SortOrder)
            .ToListAsync();

        return Ok(ApiResponse<List<Banner>>.SuccessResponse(items, "Lấy danh sách Banner thành công."));
    }

    /// <summary>
    /// Tạo Banner mới (Admin)
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Banner dto)
    {
        dto.CreatedAt = DateTime.UtcNow;
        await _context.Banners.InsertOneAsync(dto);
        return Ok(ApiResponse<Banner>.SuccessResponse(dto, "Tạo Banner thành công."));
    }

    /// <summary>
    /// Đổi trạng thái Ẩn/Hiện Banner (Admin)
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize]
    public async Task<IActionResult> ToggleStatus(string id)
    {
        var banner = await _context.Banners.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (banner == null) return NotFound();

        var update = Builders<Banner>.Update.Set(b => b.IsActive, !banner.IsActive);
        await _context.Banners.UpdateOneAsync(b => b.Id == id, update);

        return Ok(ApiResponse<object>.SuccessResponse(new { id, isActive = !banner.IsActive }, "Cập nhật trạng thái thành công."));
    }

    /// <summary>
    /// Xóa Banner (Admin)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        await _context.Banners.DeleteOneAsync(b => b.Id == id);
        return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Xóa Banner thành công."));
    }
}
