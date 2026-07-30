using api.Database.Entities;

namespace api.Modules.DigitalContent.DTOs
{
    public class CreateChapterDto
    {
        public string BookId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int Number { get; set; }
        public string? Summary { get; set; }
        public ChapterContent? Content { get; set; }
    }

    public class UpdateChapterDto
    {
        public string? Title { get; set; }
        public int? Number { get; set; }
        public string? Summary { get; set; }
        public ChapterContent? Content { get; set; }
    }

    public class ChapterResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int Number { get; set; }
        public string? Summary { get; set; }
        public ChapterContent? Content { get; set; }
        public string Status { get; set; } = string.Empty;
        public int WordCount { get; set; }
        public int ReadingTime { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
    }

    public class ChapterContentDto
    {
        public string? Introduction { get; set; }
        public List<ParagraphDto> Paragraphs { get; set; } = new();
        public string? Conclusion { get; set; }
        public List<TableDto>? Tables { get; set; }
        public List<ImageDto>? Images { get; set; }
        public List<FootnoteDto>? Footnotes { get; set; }
    }

    public class ParagraphDto
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string? Style { get; set; }
        public int Order { get; set; }
        public int Indent { get; set; }
        public string Alignment { get; set; } = "left";
        public bool IsBold { get; set; }
        public bool IsItalic { get; set; }
        public bool IsUnderline { get; set; }
        public int? FontSize { get; set; }
        public string? Color { get; set; }
        public string? BackgroundColor { get; set; }
        public List<LinkDto>? Links { get; set; }
    }

    public class LinkDto
    {
        public string Url { get; set; } = string.Empty;
        public string? Text { get; set; }
        public string Target { get; set; } = "_blank";
    }

    public class TableDto
    {
        public string Id { get; set; } = string.Empty;
        public string? Caption { get; set; }
        public List<string> Headers { get; set; } = new();
        public List<List<string>> Rows { get; set; } = new();
        public List<int>? ColumnWidths { get; set; }
    }

    public class ImageDto
    {
        public string Id { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string? Caption { get; set; }
        public string? AltText { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public string Alignment { get; set; } = "center";
    }

    public class FootnoteDto
    {
        public string Id { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}