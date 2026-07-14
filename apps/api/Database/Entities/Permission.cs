using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class Permission
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("code")]
    public string Code { get; set; } = string.Empty; // e.g. "user.read"

    [BsonElement("resource")]
    public string Resource { get; set; } = string.Empty; // e.g. "user"

    [BsonElement("action")]
    public string Action { get; set; } = string.Empty; // e.g. "read"

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;
}
