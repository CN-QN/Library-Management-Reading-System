using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public sealed class BookAuthorSnapshot
{
    [BsonElement("authorId")]
    public string AuthorId { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("role")]
    public string Role { get; set; } = "AUTHOR";

    [BsonElement("order")]
    public int Order { get; set; }
}

public sealed class BookCategorySnapshot
{
    [BsonElement("categoryId")]
    public string CategoryId { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;
}

public sealed class BookPublisherSnapshot
{
    [BsonElement("publisherId")]
    public string PublisherId { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;
}

public sealed class BookChapter
{
    [BsonElement("chapterId")]
    public string ChapterId { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("number")]
    public int Number { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("summary")]
    public string? Summary { get; set; }

    [BsonElement("content")]
    public ChapterContent Content { get; set; } = new();

    [BsonElement("wordCount")]
    public int WordCount { get; set; }

    [BsonElement("readingTime")]
    public int ReadingTime { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "DRAFT";

    [BsonElement("createdBy")]
    public string? CreatedBy { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("publishedAt")]
    public DateTime? PublishedAt { get; set; }
}

public sealed class ChapterContent
{
    [BsonElement("introduction")]
    public string? Introduction { get; set; }

    [BsonElement("paragraphs")]
    public List<Paragraph> Paragraphs { get; set; } = new();

    [BsonElement("conclusion")]
    public string? Conclusion { get; set; }

    [BsonElement("tables")]
    public List<ChapterTable> Tables { get; set; } = new();

    [BsonElement("images")]
    public List<ChapterImage> Images { get; set; } = new();

    [BsonElement("footnotes")]
    public List<ChapterFootnote> Footnotes { get; set; } = new();
}

public sealed class ChapterImage
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("url")]
    public string Url { get; set; } = string.Empty;

    [BsonElement("caption")]
    public string? Caption { get; set; }

    [BsonElement("altText")]
    public string? AltText { get; set; }

    [BsonElement("width")]
    public int? Width { get; set; }

    [BsonElement("height")]
    public int? Height { get; set; }

    [BsonElement("alignment")]
    public string Alignment { get; set; } = "center";
}

public sealed class ChapterTable
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("caption")]
    public string? Caption { get; set; }

    [BsonElement("headers")]
    public List<string> Headers { get; set; } = new();

    [BsonElement("rows")]
    public List<List<string>> Rows { get; set; } = new();

    [BsonElement("columnWidths")]
    public List<int>? ColumnWidths { get; set; }
}

public sealed class ChapterFootnote
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("reference")]
    public string Reference { get; set; } = string.Empty;

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;
}

public sealed class Paragraph
{
    [BsonElement("paragraphId")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("order")]
    public int Order { get; set; }
}
