using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

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
    public string Isbn { get; set; } = string.Empty;

    [BsonElement("summary")]
    public string Summary { get; set; } = string.Empty;

    [BsonElement("publisherId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? PublisherId { get; set; }

    [BsonElement("publicationYear")]
    public int? PublicationYear { get; set; }

    [BsonElement("language")]
    public string Language { get; set; } = "en";

    [BsonElement("coverAssetId")]
    public string? CoverAssetId { get; set; }

    [BsonElement("accessType")]
    public string AccessType { get; set; } = "FREE"; // FREE, PREMIUM, MEMBERS_ONLY

    [BsonElement("status")]
    public string Status { get; set; } = "DRAFT"; // DRAFT, REVIEW, PUBLISHED, ARCHIVED

    [BsonElement("totalChapters")]
    public int TotalChapters { get; set; } = 0;

    [BsonElement("stats")]
    public BookStats Stats { get; set; } = new BookStats();

    [BsonElement("createdBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string CreatedBy { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class BookStats
{
    [BsonElement("viewCount")]
    public int ViewCount { get; set; } = 0;

    [BsonElement("borrowCount")]
    public int BorrowCount { get; set; } = 0;

    [BsonElement("readCount")]
    public int ReadCount { get; set; } = 0;
}
