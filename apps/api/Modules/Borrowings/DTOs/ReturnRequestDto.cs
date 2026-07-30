namespace api.Modules.Borrowings.DTOs
{
    public class ReturnRequestDto
    {
        public string? Note { get; set; }
        public bool MarkAsLost { get; set; } = false;
    }
}