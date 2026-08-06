using api.Common.Models;
using api.Auth;
using api.Common.Constants;
using api.Database;
using api.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace api.Modules.Promotions.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FlashSaleController : ControllerBase
{
    private readonly MongoDbContext _context;
    private readonly RedisContext _redisContext;

    public FlashSaleController(MongoDbContext context, RedisContext redisContext)
    {
        _context = context;
        _redisContext = redisContext;
    }

    /// <summary>
    /// Lấy sự kiện Flash Sale hiện tại (Cho Trang chủ & Admin)
    /// </summary>
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrent()
    {
        var sale = await _context.FlashSales
            .Find(s => s.Status == "RUNNING" && s.EndTime > DateTime.UtcNow)
            .SortByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        return Ok(ApiResponse<FlashSale>.SuccessResponse(sale, "Lấy thông tin Flash Sale thành công."));
    }

    /// <summary>
    /// Lấy danh sách Flash Sale (Cho Admin & FE)
    /// </summary>
    [HttpGet]
    [RequirePermission(Permissions.PromotionFlashSaleManage)]
    public async Task<IActionResult> GetList()
    {
        var items = await _context.FlashSales
            .Find(Builders<FlashSale>.Filter.Empty)
            .SortByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse<List<FlashSale>>.SuccessResponse(items, "Lấy danh sách Flash Sale thành công."));
    }

    /// <summary>
    /// Lấy tất cả sự kiện Flash Sale (Admin)
    /// </summary>
    [HttpGet("all")]
    [RequirePermission(Permissions.PromotionFlashSaleManage)]
    public async Task<IActionResult> GetAll()
    {
        var items = await _context.FlashSales
            .Find(Builders<FlashSale>.Filter.Empty)
            .SortByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse<List<FlashSale>>.SuccessResponse(items, "Lấy danh sách Flash Sale thành công."));
    }

    /// <summary>
    /// Tạo sự kiện Flash Sale mới (Admin)
    /// </summary>
    [HttpPost]
    [RequirePermission(Permissions.PromotionFlashSaleManage)]
    public async Task<IActionResult> Create([FromBody] FlashSale dto)
    {
        dto.CreatedAt = DateTime.UtcNow;
        dto.Status = "RUNNING";
        await _context.FlashSales.InsertOneAsync(dto);

        try
        {
            var db = _redisContext.GetDatabase();
            await db.KeyDeleteAsync("flashsale_current");
            await db.KeyDeleteAsync("flashsale_all");
        }
        catch { }

        return Ok(ApiResponse<FlashSale>.SuccessResponse(dto, "Tạo sự kiện Flash Sale thành công."));
    }

    /// <summary>
    /// Xóa Flash Sale (Admin)
    /// </summary>
    [HttpDelete("{id}")]
    [RequirePermission(Permissions.PromotionFlashSaleManage)]
    public async Task<IActionResult> Delete(string id)
    {
        await _context.FlashSales.DeleteOneAsync(s => s.Id == id);

        try
        {
            var db = _redisContext.GetDatabase();
            await db.KeyDeleteAsync("flashsale_current");
            await db.KeyDeleteAsync("flashsale_all");
        }
        catch { }

        return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Xóa Flash Sale thành công."));
    }
}
