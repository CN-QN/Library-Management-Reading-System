using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class ReadingSession
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("sessionId")]
    public string SessionId { get; set; } = string.Empty; // Unique string generated per tab/open e.g. UUID

    [BsonElement("bookId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BookId { get; set; } = string.Empty;

    [BsonElement("chapterId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string ChapterId { get; set; } = string.Empty;

    [BsonElement("startedAt")]
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("lastHeartbeatAt")]
    public DateTime LastHeartbeatAt { get; set; } = DateTime.UtcNow;

    [BsonElement("endedAt")]
    public DateTime? EndedAt { get; set; }

    [BsonElement("durationSeconds")]
    public int DurationSeconds { get; set; } = 0;

    [BsonElement("device")]
    public string Device { get; set; } = "UNKNOWN"; // Web, Mobile, Tablet, etc.
}
