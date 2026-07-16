using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class Role
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("code")]
    public string Code { get; set; } = string.Empty; // SUPER_ADMIN, STUDENT, etc.

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("scope")]
    public string Scope { get; set; } = "GLOBAL"; // GLOBAL, BRANCH

    [BsonElement("status")]
    public string Status { get; set; } = "ACTIVE";

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
