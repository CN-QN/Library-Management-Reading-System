using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class ReadingProgress
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("bookId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BookId { get; set; } = string.Empty;

    [BsonElement("chapterId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string ChapterId { get; set; } = string.Empty;

    [BsonElement("chapterNumber")]
    public int ChapterNumber { get; set; }

    [BsonElement("scrollPosition")]
    public double ScrollPosition { get; set; } // Scroll offset percentage or pixel

    [BsonElement("percentage")]
    public double Percentage { get; set; } // Completion percentage (0.0 to 100.0)

    [BsonElement("status")]
    public string Status { get; set; } = "READING"; // READING, COMPLETED

    [BsonElement("lastReadAt")]
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;

    [BsonElement("version")]
    public long Version { get; set; } = 1; // For handling conflicts from multiple devices
}
