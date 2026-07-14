using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class RolePermission
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("roleId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string RoleId { get; set; } = string.Empty;

    [BsonElement("permissionId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string PermissionId { get; set; } = string.Empty;
}
