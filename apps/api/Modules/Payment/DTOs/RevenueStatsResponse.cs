namespace api.Modules.Payment.DTOs;

public class RevenueStatsResponse
{
    public decimal TotalRevenue { get; set; }
    public decimal TodayRevenue { get; set; }
    public long SuccessOrdersCount { get; set; }
    public long PendingOrdersCount { get; set; }
    public long TotalOrdersCount { get; set; }
}
