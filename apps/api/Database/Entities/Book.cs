using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

[BsonIgnoreExtraElements]
public class Book
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("isbn")]
    public string? ISBN { get; set; }

    [BsonElement("summary")]
    public string? Summary { get; set; }

    [BsonElement("publicationYear")]
    public int? PublicationYear { get; set; }

    // Temporary compile-time aliases for code migrated in later aggregate tasks.
    [BsonIgnore]
    [Obsolete("Use Publisher instead.")]
    public string? PublisherId { get; set; }

    [BsonIgnore]
    [Obsolete("Use Categories instead.")]
    public List<string> CategoryIds { get; set; } = new();

    [BsonIgnore]
    [Obsolete("Use Authors instead.")]
    public List<string> AuthorIds { get; set; } = new();

    [BsonElement("language")]
    public string Language { get; set; } = "vi";

    [BsonElement("coverAssetId")]
    public string? CoverAssetId { get; set; }

    [BsonElement("accessType")]
    public string AccessType { get; set; } = "FREE";

    [BsonElement("price")]
    public decimal Price { get; set; } = 10000;

    [BsonElement("status")]
    public string Status { get; set; } = "DRAFT";

    [BsonElement("authors")]
    public List<BookAuthorSnapshot> Authors { get; set; } = new();

    [BsonElement("categories")]
    public List<BookCategorySnapshot> Categories { get; set; } = new();

    [BsonElement("publisher")]
    public BookPublisherSnapshot? Publisher { get; set; }

    [BsonElement("chapters")]
    public List<BookChapter> Chapters { get; set; } = new();

    [BsonElement("totalChapters")]
    public int TotalChapters { get; set; }

    [BsonElement("stats")]
    public BookStats Stats { get; set; } = new();

    [BsonElement("createdBy")]
    public string? CreatedBy { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class BookStats
{
    [BsonElement("viewCount")]
    public int ViewCount { get; set; }

    [BsonElement("readingCount")]
    public int ReadingCount { get; set; }

    [BsonElement("rating")]
    public double Rating { get; set; }

    [BsonElement("ratingCount")]
    public int RatingCount { get; set; }
}
