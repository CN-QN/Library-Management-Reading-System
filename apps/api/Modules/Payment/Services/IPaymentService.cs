using api.Modules.Payment.DTOs;

namespace api.Modules.Payment.Services;

public interface IPaymentService
{
    Task<PaymentQrResponse> CreatePaymentQrAsync(string userId, string bookId);
    Task<bool> ProcessSePayWebhookAsync(SePayWebhookDto dto);
    Task<bool> CheckBookAccessAsync(string userId, string bookId);
    Task<PaymentQrResponse?> GetOrderStatusAsync(string userId, string orderCode);
    Task<List<PaymentQrResponse>> GetMyOrdersAsync(string userId);
    Task<List<PaymentQrResponse>> GetAllOrdersAsync();
    Task<RevenueStatsResponse> GetRevenueStatsAsync();
}
