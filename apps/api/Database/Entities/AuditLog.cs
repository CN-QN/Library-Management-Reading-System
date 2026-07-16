using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class AuditLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("actorId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? ActorId { get; set; } // Null if anonymous / system

    [BsonElement("action")]
    public string Action { get; set; } = string.Empty; // e.g. "CREATE", "UPDATE", "DELETE", "LOGIN"

    [BsonElement("resource")]
    public string Resource { get; set; } = string.Empty; // e.g. "users", "books"

    [BsonElement("resourceId")]
    public string? ResourceId { get; set; }

    [BsonElement("before")]
    public string? Before { get; set; } // Serialized JSON before changes

    [BsonElement("after")]
    public string? After { get; set; } // Serialized JSON after changes

    [BsonElement("ip")]
    public string Ip { get; set; } = string.Empty;

    [BsonElement("userAgent")]
    public string UserAgent { get; set; } = string.Empty;

    [BsonElement("traceId")]
    public string TraceId { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
