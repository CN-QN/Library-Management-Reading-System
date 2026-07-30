namespace api.Modules.Inventory.DTOs
{
    public class InventoryTransactionRequestDto
    {
        public string BookCopyId { get; set; } = string.Empty;
        public string TransactionType { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public string? FromLocation { get; set; }
        public string? ToLocation { get; set; }
        public string? Note { get; set; }
        public string? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public Dictionary<string, string>? Metadata { get; set; }
    }
}