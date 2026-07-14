using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class DigitalAsset
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("bookId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BookId { get; set; } = string.Empty;

    [BsonElement("type")]
    public string Type { get; set; } = string.Empty; // COVER, EPUB, PDF, AUDIO

    [BsonElement("url")]
    public string Url { get; set; } = string.Empty;

    [BsonElement("mimeType")]
    public string MimeType { get; set; } = string.Empty;

    [BsonElement("size")]
    public long Size { get; set; } // in bytes

    [BsonElement("checksum")]
    public string Checksum { get; set; } = string.Empty; // SHA256 of file

    [BsonElement("accessLevel")]
    public string AccessLevel { get; set; } = "FREE"; // FREE, PREMIUM, MEMBERS_ONLY

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
