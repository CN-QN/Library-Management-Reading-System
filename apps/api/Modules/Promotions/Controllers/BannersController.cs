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
    private readonly RedisContext _redisContext;

    public BannersController(MongoDbContext context, RedisContext redisContext)
    {
        _context = context;
        _redisContext = redisContext;
    }

    /// <summary>
    /// Lấy danh sách Banner active (Cho Trang chủ & Admin)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] bool? activeOnly = null)
    {
        var filter = activeOnly == true
            ? Builders<Banner>.Filter.Eq(b => b.IsActive, true)
            : Builders<Banner>.Filter.Empty;

        var items = await _context.Banners.Find(filter)
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

        try
        {
            var db = _redisContext.GetDatabase();
            await db.KeyDeleteAsync("banners_list");
        }
        catch { }

        return Ok(ApiResponse<Banner>.SuccessResponse(dto, "Tạo Banner thành công."));
    }

    /// <summary>
    /// Chỉnh sửa Banner (Admin)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] Banner dto)
    {
        var existing = await _context.Banners.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (existing == null) return NotFound(ApiResponse<object>.ErrorResponse(404, "Không tìm thấy Banner."));

        existing.Title = dto.Title;
        existing.Subtitle = dto.Subtitle;
        existing.ImageUrl = dto.ImageUrl;
        existing.LinkUrl = dto.LinkUrl;

        await _context.Banners.ReplaceOneAsync(b => b.Id == id, existing);

        try
        {
            var db = _redisContext.GetDatabase();
            await db.KeyDeleteAsync("banners_list");
        }
        catch { }

        return Ok(ApiResponse<Banner>.SuccessResponse(existing, "Cập nhật Banner thành công."));
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

        try
        {
            var db = _redisContext.GetDatabase();
            await db.KeyDeleteAsync("banners_list");
        }
        catch { }

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

        try
        {
            var db = _redisContext.GetDatabase();
            await db.KeyDeleteAsync("banners_list");
        }
        catch { }

        return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Xóa Banner thành công."));
    }
}
