using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities
{
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

    public class ChapterContent
    {
        [BsonElement("introduction")]
        public string? Introduction { get; set; }

        [BsonElement("paragraphs")]
        public List<Paragraph> Paragraphs { get; set; } = new();

        [BsonElement("conclusion")]
        public string? Conclusion { get; set; }
    }

    public class Paragraph
    {
        [BsonElement("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [BsonElement("text")]
        public string Text { get; set; } = string.Empty;

        [BsonElement("order")]
        public int Order { get; set; }
    }
}