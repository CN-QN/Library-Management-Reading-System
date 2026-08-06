namespace api.Modules.Files.DTOs
{
    public class FileUploadResponseDto
    {
        public string FileId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string? BookId { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
