using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class UserRole
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("roleId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string RoleId { get; set; } = string.Empty;

    [BsonElement("branchId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? BranchId { get; set; }

    [BsonElement("expiresAt")]
    public DateTime? ExpiresAt { get; set; }
}
