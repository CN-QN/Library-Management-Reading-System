using api.Common.Models;
using api.Database;
using api.Database.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace api.Modules.Promotions.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VouchersController : ControllerBase
{
    private readonly MongoDbContext _context;
    private readonly ILogger<VouchersController> _logger;

    public VouchersController(MongoDbContext context, ILogger<VouchersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách Voucher (Admin & Reader)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetList()
    {
        var items = await _context.Vouchers.Find(Builders<Voucher>.Filter.Empty)
            .SortByDescending(v => v.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse<List<Voucher>>.SuccessResponse(items, "Lấy danh sách Voucher thành công."));
    }

    /// <summary>
    /// Tạo Voucher mới (Admin)
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Voucher dto)
    {
        dto.Code = dto.Code.ToUpper().Trim();
        var existing = await _context.Vouchers.Find(v => v.Code == dto.Code).FirstOrDefaultAsync();
        if (existing != null)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(400, "Mã Voucher đã tồn tại trên hệ thống."));
        }

        dto.CreatedAt = DateTime.UtcNow;
        await _context.Vouchers.InsertOneAsync(dto);
        return Ok(ApiResponse<Voucher>.SuccessResponse(dto, "Tạo Voucher thành công."));
    }

    /// <summary>
    /// Áp dụng mã Voucher khi thanh toán VietQR
    /// </summary>
    [HttpPost("apply")]
    public async Task<IActionResult> Apply([FromBody] ApplyVoucherRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(400, "Vui lòng nhập mã Voucher."));
        }

        var code = request.Code.ToUpper().Trim();
        var voucher = await _context.Vouchers.Find(v => v.Code == code && v.Status == "ACTIVE").FirstOrDefaultAsync();

        if (voucher == null)
        {
            return NotFound(ApiResponse<object>.ErrorResponse(404, "Mã Voucher không tồn tại hoặc đã hết hạn."));
        }

        if (voucher.ExpiresAt < DateTime.UtcNow || voucher.UsedCount >= voucher.MaxUsage)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(400, "Mã Voucher đã hết hạn sử dụng."));
        }

        decimal discount = 0;
        if (voucher.DiscountType == "PERCENT")
        {
            discount = request.OriginalPrice * (voucher.DiscountValue / 100m);
        }
        else
        {
            discount = voucher.DiscountValue;
        }

        decimal finalPrice = Math.Max(0, request.OriginalPrice - discount);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            code = voucher.Code,
            discountAmount = discount,
            finalPrice = finalPrice,
            message = $"Áp dụng mã {voucher.Code} thành công!"
        }));
    }

    /// <summary>
    /// Xóa Voucher (Admin)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        await _context.Vouchers.DeleteOneAsync(v => v.Id == id);
        return Ok(ApiResponse<object>.SuccessResponse(new { id }, "Xóa Voucher thành công."));
    }
}

public class ApplyVoucherRequest
{
    public string Code { get; set; } = string.Empty;
    public decimal OriginalPrice { get; set; } = 10000;
}
