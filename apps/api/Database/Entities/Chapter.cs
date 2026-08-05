using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

/// <summary>
/// Legacy standalone chapter document retained temporarily for migration compatibility.
/// New chapter data is embedded in <see cref="Book.Chapters"/>.
/// </summary>
[Obsolete("Use BookChapter embedded in Book.Chapters instead.")]
public class Chapter
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("bookId")]
    public string BookId { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("number")]
    public int Number { get; set; }

    [BsonElement("summary")]
    public string? Summary { get; set; }

    [BsonElement("content")]
    public ChapterContent? Content { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "DRAFT";

    [BsonElement("wordCount")]
    public int WordCount { get; set; }

    [BsonElement("readingTime")]
    public int ReadingTime { get; set; }

    [BsonElement("createdBy")]
    public string? CreatedBy { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("publishedAt")]
    public DateTime? PublishedAt { get; set; }
}
