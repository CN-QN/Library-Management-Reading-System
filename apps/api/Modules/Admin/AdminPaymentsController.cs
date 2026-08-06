using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Modules.Payment.DTOs;
using api.Modules.Payment.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Modules.Admin;

[ApiController, Route("api/admin/payments")]
public sealed class AdminPaymentsController : ControllerBase
{
    private readonly IPaymentService _payments;
    public AdminPaymentsController(IPaymentService payments) => _payments = payments;

    [HttpGet("orders"), RequireAnyPermission(Permissions.PaymentRead, Permissions.ReportView)]
    public async Task<ActionResult<ApiResponse<List<PaymentQrResponse>>>> GetOrders() =>
        Ok(ApiResponse<List<PaymentQrResponse>>.SuccessResponse(await _payments.GetAllOrdersAsync()));

    [HttpGet("revenue-summary"), RequireAnyPermission(Permissions.PaymentRead, Permissions.ReportView)]
    public async Task<ActionResult<ApiResponse<RevenueStatsResponse>>> GetRevenue() =>
        Ok(ApiResponse<RevenueStatsResponse>.SuccessResponse(await _payments.GetRevenueStatsAsync()));
}
