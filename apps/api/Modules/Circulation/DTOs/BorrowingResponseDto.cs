namespace api.Modules.Circulation.DTOs
{
    public class BorrowingItemResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string BorrowingId { get; set; } = string.Empty;
        public string CopyId { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public string? BookTitle { get; set; }
        public string? ShelfCode { get; set; }
        public DateTime DueAt { get; set; }
        public DateTime? ReturnedAt { get; set; }
        public int RenewCount { get; set; }
        public string ConditionOut { get; set; } = "GOOD";
        public string? ConditionIn { get; set; }
        public string Status { get; set; } = "BORROWED";
    }

    public class BorrowingResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? StudentCode { get; set; }
        public string BranchId { get; set; } = string.Empty;
        public string? BranchName { get; set; }
        public string Status { get; set; } = "OPEN";
        public DateTime BorrowedAt { get; set; }
        public DateTime ExpectedReturnAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? Note { get; set; }
        public List<BorrowingItemResponseDto> Items { get; set; } = new();
    }
}
