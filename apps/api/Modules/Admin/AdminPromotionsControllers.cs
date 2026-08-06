using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Database;
using api.Database.Entities;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace api.Modules.Admin;

[ApiController, Route("api/admin/banners"), RequirePermission(Permissions.PromotionBannerManage)]
public sealed class AdminBannersController : ControllerBase
{
    private readonly MongoDbContext _context;
    public AdminBannersController(MongoDbContext context) => _context = context;

    [HttpGet] public async Task<IActionResult> List() => Ok(ApiResponse<List<Banner>>.SuccessResponse(await _context.Banners.Find(Builders<Banner>.Filter.Empty).SortBy(x => x.SortOrder).ToListAsync()));
    [HttpPost] public async Task<IActionResult> Create(BannerMutation input)
    {
        var error = await ValidateMedia(input.MediaId); if (error is not null) return error;
        var asset = await _context.FileAssets.Find(x => x.Id == input.MediaId).FirstAsync();
        var banner = new Banner { Title = input.Title.Trim(), Subtitle = input.Subtitle?.Trim() ?? string.Empty, ImageUrl = asset.FileUrl, MediaId = asset.Id, LinkUrl = string.IsNullOrWhiteSpace(input.LinkUrl) ? "/books" : input.LinkUrl, IsActive = input.IsActive, SortOrder = input.SortOrder };
        await _context.Banners.InsertOneAsync(banner); return Ok(ApiResponse<Banner>.SuccessResponse(banner));
    }
    [HttpPut("{id}")] public async Task<IActionResult> Update(string id, BannerMutation input)
    {
        var error = await ValidateMedia(input.MediaId); if (error is not null) return error;
        var banner = await _context.Banners.Find(x => x.Id == id).FirstOrDefaultAsync(); if (banner is null) return NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy banner."));
        var asset = await _context.FileAssets.Find(x => x.Id == input.MediaId).FirstAsync();
        banner.Title = input.Title.Trim(); banner.Subtitle = input.Subtitle?.Trim() ?? string.Empty; banner.ImageUrl = asset.FileUrl; banner.MediaId = asset.Id; banner.LinkUrl = input.LinkUrl; banner.IsActive = input.IsActive; banner.SortOrder = input.SortOrder;
        await _context.Banners.ReplaceOneAsync(x => x.Id == id, banner); return Ok(ApiResponse<Banner>.SuccessResponse(banner));
    }
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(string id) { var result = await _context.Banners.DeleteOneAsync(x => x.Id == id); return result.DeletedCount == 0 ? NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy banner.")) : Ok(ApiResponse.SuccessResponse()); }
    private async Task<IActionResult?> ValidateMedia(string mediaId)
    {
        if (string.IsNullOrWhiteSpace(mediaId)) return BadRequest(ApiResponse.ErrorResponse(400, "Banner mediaId is required."));
        var asset = await _context.FileAssets.Find(x => x.Id == mediaId).FirstOrDefaultAsync();
        return asset is null || asset.UsageType != "banner" ? BadRequest(ApiResponse.ErrorResponse(400, "Media banner không hợp lệ.")) : null;
    }
}

public sealed record BannerMutation(string Title, string? Subtitle, string MediaId, string LinkUrl, bool IsActive, int SortOrder);

[ApiController, Route("api/admin/flash-sales"), RequirePermission(Permissions.PromotionFlashSaleManage)]
public sealed class AdminFlashSalesController : ControllerBase
{
    private readonly MongoDbContext _context; public AdminFlashSalesController(MongoDbContext context) => _context = context;
    [HttpGet] public async Task<IActionResult> List() => Ok(ApiResponse<List<FlashSale>>.SuccessResponse(await _context.FlashSales.Find(Builders<FlashSale>.Filter.Empty).SortByDescending(x => x.CreatedAt).ToListAsync()));
    [HttpPost] public async Task<IActionResult> Create(FlashSale input)
    {
        var error = Validate(input); if (error is not null) return error; input.Id = string.Empty; input.CreatedAt = DateTime.UtcNow; input.Status = DeriveStatus(input);
        await _context.FlashSales.InsertOneAsync(input); return Ok(ApiResponse<FlashSale>.SuccessResponse(input));
    }
    [HttpPut("{id}")] public async Task<IActionResult> Update(string id, FlashSale input)
    {
        var error = Validate(input); if (error is not null) return error; var existing = await _context.FlashSales.Find(x => x.Id == id).FirstOrDefaultAsync(); if (existing is null) return NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy flash sale."));
        input.Id = id; input.CreatedAt = existing.CreatedAt; input.Status = DeriveStatus(input); await _context.FlashSales.ReplaceOneAsync(x => x.Id == id, input); return Ok(ApiResponse<FlashSale>.SuccessResponse(input));
    }
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(string id) { var result = await _context.FlashSales.DeleteOneAsync(x => x.Id == id); return result.DeletedCount == 0 ? NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy flash sale.")) : Ok(ApiResponse.SuccessResponse()); }
    private IActionResult? Validate(FlashSale x) => string.IsNullOrWhiteSpace(x.Name) || x.StartTime >= x.EndTime || x.SalePrice < 0 || x.SalePrice >= x.OriginalPrice ? BadRequest(ApiResponse.ErrorResponse(400, "Thông tin flash sale không hợp lệ.")) : null;
    private static string DeriveStatus(FlashSale x) => DateTime.UtcNow < x.StartTime ? "UPCOMING" : DateTime.UtcNow >= x.EndTime ? "ENDED" : "RUNNING";
}

[ApiController, Route("api/admin/vouchers"), RequirePermission(Permissions.PromotionVoucherManage)]
public sealed class AdminVouchersController : ControllerBase
{
    private readonly MongoDbContext _context; public AdminVouchersController(MongoDbContext context) => _context = context;
    [HttpGet] public async Task<IActionResult> List() => Ok(ApiResponse<List<Voucher>>.SuccessResponse(await _context.Vouchers.Find(Builders<Voucher>.Filter.Empty).SortByDescending(x => x.CreatedAt).ToListAsync()));
    [HttpPost] public async Task<IActionResult> Create(Voucher input)
    {
        input.Code = input.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(input.Code) || input.DiscountValue <= 0 || input.MaxUsage <= 0 || input.ExpiresAt <= DateTime.UtcNow || (input.DiscountType == "PERCENT" && input.DiscountValue > 100)) return BadRequest(ApiResponse.ErrorResponse(400, "Thông tin voucher không hợp lệ."));
        if (await _context.Vouchers.Find(x => x.Code == input.Code).AnyAsync()) return Conflict(ApiResponse.ErrorResponse(409, "Mã voucher đã tồn tại."));
        input.Id = string.Empty; input.CreatedAt = DateTime.UtcNow; input.UsedCount = 0; input.Status = "ACTIVE"; await _context.Vouchers.InsertOneAsync(input); return Ok(ApiResponse<Voucher>.SuccessResponse(input));
    }
    [HttpPut("{id}")] public async Task<IActionResult> Update(string id, Voucher input)
    {
        var existing = await _context.Vouchers.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (existing is null) return NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy voucher."));
        input.Code = input.Code.Trim().ToUpperInvariant();
        input.DiscountType = input.DiscountType.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(input.Code) || input.DiscountValue <= 0 || input.MaxUsage <= 0 || input.MaxUsage < existing.UsedCount || (input.DiscountType == "PERCENT" && input.DiscountValue > 100))
            return BadRequest(ApiResponse.ErrorResponse(400, "Thông tin voucher không hợp lệ."));
        if (await _context.Vouchers.Find(x => x.Id != id && x.Code == input.Code).AnyAsync())
            return Conflict(ApiResponse.ErrorResponse(409, "Mã voucher đã tồn tại."));
        input.Id = id; input.CreatedAt = existing.CreatedAt; input.UsedCount = existing.UsedCount;
        input.Status = input.Status is "ACTIVE" or "DISABLED" ? input.Status : existing.Status;
        if (input.ExpiresAt <= DateTime.UtcNow) input.Status = "EXPIRED";
        await _context.Vouchers.ReplaceOneAsync(x => x.Id == id, input);
        return Ok(ApiResponse<Voucher>.SuccessResponse(input));
    }
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(string id) { var result = await _context.Vouchers.DeleteOneAsync(x => x.Id == id); return result.DeletedCount == 0 ? NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy voucher.")) : Ok(ApiResponse.SuccessResponse()); }
}
