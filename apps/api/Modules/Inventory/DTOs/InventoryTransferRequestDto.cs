namespace api.Modules.Inventory.DTOs
{
    public class InventoryTransferRequestDto
    {
        public string BookCopyId { get; set; } = string.Empty;
        public string ToLocation { get; set; } = string.Empty;
        public string? Note { get; set; }
    }
}