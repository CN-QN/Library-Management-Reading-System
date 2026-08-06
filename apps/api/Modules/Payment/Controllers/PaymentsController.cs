using System.Security.Claims;
using api.Common.Models;
using api.Configuration;
using api.Modules.Payment.DTOs;
using api.Modules.Payment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace api.Modules.Payment.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly SePaySettings _sePaySettings;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        IPaymentService paymentService,
        IOptions<SePaySettings> sePayOptions,
        ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _sePaySettings = sePayOptions.Value;
        _logger = logger;
    }

    /// <summary>
    /// Tạo mã QR VietQR SePay để thanh toán mua quyền đọc sách Premium
    /// </summary>
    [HttpPost("create-qr")]
    [Authorize]
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
    public async Task<IActionResult> SePayWebhook(
        [FromBody] SePayWebhookDto dto,
        [FromHeader(Name = "Authorization")] string? authHeader)
    {
        if (!string.IsNullOrWhiteSpace(_sePaySettings.ApiKey))
        {
            var expectedToken = _sePaySettings.ApiKey.Trim();

            // Kiểm tra token ở tất cả các vị trí header SePay có thể gửi
            var authHeaderStr = Request.Headers["Authorization"].ToString();
            var xApiKeyHeaderStr = Request.Headers["x-sepay-api-key"].ToString();
            var apiKeyHeaderStr = Request.Headers["Apikey"].ToString();
            var customHeaderStr = Request.Headers["api-key"].ToString();

            var combinedHeaders = $"{authHeaderStr} {xApiKeyHeaderStr} {apiKeyHeaderStr} {customHeaderStr}".Trim();

            if (string.IsNullOrWhiteSpace(combinedHeaders) || !combinedHeaders.Contains(expectedToken, StringComparison.Ordinal))
            {
                _logger.LogWarning("SePay Webhook Authorization verification failed. Expected ApiKey: '{Expected}', Received headers: Authorization='{Auth}', x-sepay-api-key='{XApi}', Apikey='{Apikey}'",
                    expectedToken, authHeaderStr, xApiKeyHeaderStr, apiKeyHeaderStr);
                return Unauthorized(new { status = 401, message = "Unauthorized webhook request. Secret token mismatch." });
            }
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
        var order = await _paymentService.GetOrderStatusAsync(orderCode);
        if (order == null)
        {
            return NotFound(ApiResponse<PaymentQrResponse>.ErrorResponse(404, "Không tìm thấy đơn hàng"));
        }

        return Ok(ApiResponse<PaymentQrResponse>.SuccessResponse(order));
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
    public async Task<ActionResult<ApiResponse<List<PaymentQrResponse>>>> GetAllOrders()
    {
        var orders = await _paymentService.GetAllOrdersAsync();
        return Ok(ApiResponse<List<PaymentQrResponse>>.SuccessResponse(orders));
    }

    /// <summary>
    /// Admin: Lấy thống kê doanh thu SePay
    /// </summary>
    [HttpGet("admin/revenue-stats")]
    public async Task<ActionResult<ApiResponse<RevenueStatsResponse>>> GetRevenueStats()
    {
        var stats = await _paymentService.GetRevenueStatsAsync();
        return Ok(ApiResponse<RevenueStatsResponse>.SuccessResponse(stats));
    }
}
