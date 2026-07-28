namespace api.Modules.DigitalContent.DTOs
{
    public class CreateChapterDto
    {
        public string BookId { get; set; } = string.Empty;
        public int Number { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? ContentJson { get; set; }
        public int? WordCount { get; set; }
    }

    public class UpdateChapterDto
    {
        public string? Title { get; set; }
        public string? ContentJson { get; set; }
        public int? WordCount { get; set; }
    }

    public class ChapterResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public int Number { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? ContentJson { get; set; }
        public int WordCount { get; set; }
        public string Status { get; set; } = "DRAFT";
        public int Version { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ChapterContentDto
    {
        public string Id { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public int Number { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ContentJson { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }
}