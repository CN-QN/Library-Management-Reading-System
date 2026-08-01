namespace api.Modules.Borrowings.DTOs
{
    public class BorrowRequestDto
    {
        public string BookCopyId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public int DaysToBorrow { get; set; } = 14; // Mặc định 14 ngày
        public string? Note { get; set; }
    }
}