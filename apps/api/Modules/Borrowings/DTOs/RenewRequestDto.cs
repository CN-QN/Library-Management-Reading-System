namespace api.Modules.Borrowings.DTOs
{
    public class RenewRequestDto
    {
        public int ExtraDays { get; set; } = 7; // Mặc định gia hạn thêm 7 ngày
        public string? Note { get; set; }
    }
}