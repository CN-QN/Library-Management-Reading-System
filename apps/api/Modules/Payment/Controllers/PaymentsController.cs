using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Configuration;
using api.Database;
using api.Modules.Payment.DTOs;
using api.Modules.Payment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace api.Modules.Payment.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly MongoDbContext _context;
    private readonly SePaySettings _sePaySettings;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        IPaymentService paymentService,
        MongoDbContext context,
        IOptions<SePaySettings> sePayOptions,
        ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _context = context;
        _sePaySettings = sePayOptions.Value;
        _logger = logger;
    }

    /// <summary>
    /// Tạo mã QR VietQR SePay để thanh toán mua quyền đọc sách Premium
    /// </summary>
    [HttpPost("create-qr")]
    [Authorize]
    [api.Common.Middleware.RedisRateLimit(MaxRequests = 10, WindowSeconds = 60)]
    public async Task<ActionResult<ApiResponse<PaymentQrResponse>>> CreatePaymentQr([FromBody] CreatePaymentQrRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<PaymentQrResponse>.ErrorResponse(401, "Người dùng chưa xác thực"));
        }

        try
        {
            var response = await _paymentService.CreatePaymentQrAsync(userId, request.BookId);
            return Ok(ApiResponse<PaymentQrResponse>.SuccessResponse(response, "Khởi tạo mã VietQR thanh toán thành công"));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<PaymentQrResponse>.ErrorResponse(404, ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi khởi tạo mã QR thanh toán");
            return StatusCode(500, ApiResponse<PaymentQrResponse>.ErrorResponse(500, "Không thể tạo mã QR thanh toán"));
        }
    }

    /// <summary>
    /// Callback Webhook nhận thông báo chuyển khoản tự động từ SePay Gateway
    /// </summary>
    [HttpPost("sepay-webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> SePayWebhook([FromBody] SePayWebhookDto dto)
    {
        var storedApiKey = await _context.SystemSettings.Find(x => x.Key == "SEPAY_API_KEY")
            .Project(x => x.Value).FirstOrDefaultAsync();
        var expectedToken = !string.IsNullOrWhiteSpace(storedApiKey) ? storedApiKey : _sePaySettings.ApiKey;
        if (string.IsNullOrWhiteSpace(expectedToken))
        {
            _logger.LogError("SePay webhook rejected because its API key is not configured.");
            return StatusCode(503, new { status = 503, message = "Webhook authentication is not configured." });
        }

        var suppliedTokens = new[]
        {
            Request.Headers["Authorization"].ToString(),
            Request.Headers["x-sepay-api-key"].ToString(),
            Request.Headers["Apikey"].ToString(),
            Request.Headers["api-key"].ToString()
        };
        if (!suppliedTokens.Any(value => CredentialMatches(value, expectedToken)))
        {
            _logger.LogWarning("SePay webhook rejected because its credential was missing or invalid.");
            return Unauthorized(new { status = 401, message = "Unauthorized webhook request." });
        }

        try
        {
            var success = await _paymentService.ProcessSePayWebhookAsync(dto);
            if (success)
            {
                return Ok(new { status = 200, message = "Webhook processed successfully" });
            }
            return BadRequest(new { status = 400, message = "Invalid webhook payload or order not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xử lý SePay Webhook");
            return StatusCode(500, new { status = 500, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Kiểm tra trạng thái đơn hàng thanh toán
    /// </summary>
    [HttpGet("status/{orderCode}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PaymentQrResponse>>> GetOrderStatus(string orderCode)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized(ApiResponse.ErrorResponse(401, "Chưa đăng nhập"));
        var order = await _paymentService.GetOrderStatusAsync(userId, orderCode);
        if (order == null)
        {
            return NotFound(ApiResponse<PaymentQrResponse>.ErrorResponse(404, "Không tìm thấy đơn hàng"));
        }

        return Ok(ApiResponse<PaymentQrResponse>.SuccessResponse(order));
    }

    private static bool CredentialMatches(string supplied, string expected)
    {
        var value = supplied.Trim();
        foreach (var prefix in new[] { "Bearer ", "Apikey ", "ApiKey " })
        {
            if (value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                value = value[prefix.Length..].Trim();
                break;
            }
        }

        var suppliedHash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected.Trim()));
        return CryptographicOperations.FixedTimeEquals(suppliedHash, expectedHash);
    }

    /// <summary>
    /// Kiểm tra người dùng hiện tại đã có quyền đọc sách Premium hay chưa
    /// </summary>
    [HttpGet("check-access/{bookId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> CheckAccess(string bookId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<object>.ErrorResponse(401, "Chưa đăng nhập"));
        }

        var hasAccess = await _paymentService.CheckBookAccessAsync(userId, bookId);
        return Ok(ApiResponse<object>.SuccessResponse(new { hasAccess, bookId }));
    }

    /// <summary>
    /// Lấy danh sách lịch sử đơn hàng thanh toán của Độc giả hiện tại
    /// </summary>
    [HttpGet("my-orders")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<PaymentQrResponse>>>> GetMyOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<List<PaymentQrResponse>>.ErrorResponse(401, "Chưa đăng nhập"));
        }

        var orders = await _paymentService.GetMyOrdersAsync(userId);
        return Ok(ApiResponse<List<PaymentQrResponse>>.SuccessResponse(orders));
    }

    /// <summary>
    /// Admin: Lấy toàn bộ đơn hàng thanh toán SePay
    /// </summary>
    [HttpGet("admin/all-orders")]
    [RequireAnyPermission(Permissions.PaymentRead, Permissions.ReportView)]
    public async Task<ActionResult<ApiResponse<List<PaymentQrResponse>>>> GetAllOrders()
    {
        var orders = await _paymentService.GetAllOrdersAsync();
        return Ok(ApiResponse<List<PaymentQrResponse>>.SuccessResponse(orders));
    }

    /// <summary>
    /// Admin: Lấy thống kê doanh thu SePay
    /// </summary>
    [HttpGet("admin/revenue-stats")]
    [RequireAnyPermission(Permissions.PaymentRead, Permissions.ReportView)]
    public async Task<ActionResult<ApiResponse<RevenueStatsResponse>>> GetRevenueStats()
    {
        var stats = await _paymentService.GetRevenueStatsAsync();
        return Ok(ApiResponse<RevenueStatsResponse>.SuccessResponse(stats));
    }

    /// <summary>
    /// Lấy thông tin ngân hàng thụ hưởng SePay (public – không cần đăng nhập)
    /// </summary>
    [HttpGet("bank-info")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBankInfo()
    {
        var storedSettings = await _context.SystemSettings.Find(x => x.Scope == "SEPAY").ToListAsync();
        var bankName = storedSettings.FirstOrDefault(x => x.Key == "SEPAY_BANK_NAME")?.Value ?? _sePaySettings.BankName;
        var bankAccount = storedSettings.FirstOrDefault(x => x.Key == "SEPAY_BANK_ACCOUNT")?.Value ?? _sePaySettings.BankAccount;
        var accountName = storedSettings.FirstOrDefault(x => x.Key == "SEPAY_ACCOUNT_NAME")?.Value ?? _sePaySettings.AccountName;
        return Ok(ApiResponse<object>.SuccessResponse(new { bankName, bankAccount, accountName }));
    }
}
