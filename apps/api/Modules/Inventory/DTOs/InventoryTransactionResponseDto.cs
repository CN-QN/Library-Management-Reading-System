namespace api.Modules.Inventory.DTOs
{
    public class InventoryTransactionResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string BookCopyId { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public string BookTitle { get; set; } = string.Empty;
        public string TransactionType { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string? FromLocation { get; set; }
        public string? ToLocation { get; set; }
        public string? FromBranchName { get; set; }
        public string? ToBranchName { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Note { get; set; }
        public string? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public string PerformedBy { get; set; } = string.Empty;
        public string? PerformedByName { get; set; }
        public DateTime PerformedAt { get; set; }
        public Dictionary<string, string>? Metadata { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}