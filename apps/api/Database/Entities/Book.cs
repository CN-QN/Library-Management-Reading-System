using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities
{
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

        [BsonElement("publisherId")]
        public string? PublisherId { get; set; }

        [BsonElement("publicationYear")]
        public int? PublicationYear { get; set; }

        [BsonElement("language")]
        public string Language { get; set; } = "vi";

        [BsonElement("coverAssetId")]
        public string? CoverAssetId { get; set; }

        [BsonElement("accessType")]
        public string AccessType { get; set; } = "FREE";

        [BsonElement("status")]
        public string Status { get; set; } = "DRAFT";

        [BsonElement("totalChapters")]
        public int TotalChapters { get; set; }

        [BsonElement("stats")]
        public BookStats? Stats { get; set; }

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
}