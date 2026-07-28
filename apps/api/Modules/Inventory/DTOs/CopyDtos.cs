namespace api.Modules.Inventory.DTOs
{
    public class CreateCopyDto
    {
        public string BookId { get; set; } = string.Empty;
        public string BranchId { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public string? ShelfCode { get; set; }
        public string? Condition { get; set; }
        public decimal Price { get; set; }
    }

    public class UpdateCopyDto
    {
        public string? ShelfCode { get; set; }
        public string? Condition { get; set; }
        public string? Status { get; set; }
        public decimal? Price { get; set; }
    }

    public class CopyResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public string BookTitle { get; set; } = string.Empty;
        public string BranchId { get; set; } = string.Empty;
        public string BranchName { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public string? ShelfCode { get; set; }
        public string Condition { get; set; } = "GOOD";
        public string Status { get; set; } = "AVAILABLE";
        public decimal Price { get; set; }
        public DateTime AcquiredAt { get; set; }
        public DateTime? LastInventoryAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class TransferCopyDto
    {
        public string CopyId { get; set; } = string.Empty;
        public string FromBranchId { get; set; } = string.Empty;
        public string ToBranchId { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }

    public class InventoryAuditDto
    {
        public string CopyId { get; set; } = string.Empty;
        public string? Condition { get; set; }
        public string? Note { get; set; }
    }
}