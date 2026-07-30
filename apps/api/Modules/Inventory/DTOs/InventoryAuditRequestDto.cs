namespace api.Modules.Inventory.DTOs
{
    public class InventoryAuditRequestDto
    {
        public string BookCopyId { get; set; } = string.Empty;
        public int ActualQuantity { get; set; }
        public string? Note { get; set; }
    }
}