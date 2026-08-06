namespace api.Modules.Files.DTOs
{
    public class FileUploadRequestDto
    {
        public string? BookId { get; set; }
        public string? ChapterId { get; set; }
        public string FileType { get; set; } = string.Empty; // COVER, PDF, EPUB, CONTENT
        public string? Description { get; set; }
        public bool IsPublic { get; set; } = true;
    }
}
