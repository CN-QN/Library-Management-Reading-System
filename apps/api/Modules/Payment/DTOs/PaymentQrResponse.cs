namespace api.Modules.Payment.DTOs;

public class PaymentQrResponse
{
    public string OrderCode { get; set; } = string.Empty;
    public string QrCodeUrl { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentContent { get; set; } = string.Empty;
    public string BookId { get; set; } = string.Empty;
    public string BookTitle { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
}
