namespace api.Modules.Inventory.DTOs
{
    public class MarkDamagedRequestDto
    {
        public string BookCopyId { get; set; } = string.Empty;
        public string? Note { get; set; }
    }
}