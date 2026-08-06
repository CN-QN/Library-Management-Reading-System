using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("studentCode")]
    public string StudentCode { get; set; } = string.Empty;

    [BsonElement("fullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = string.Empty; // PENDING, ACTIVE, LOCKED, SUSPENDED, DELETED

    [BsonElement("branchId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? BranchId { get; set; }

    [BsonElement("avatar")]
    public string? Avatar { get; set; }

    [BsonElement("lastLoginAt")]
    public DateTime? LastLoginAt { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [BsonElement("notifyBookAvailable")]
    public bool NotifyBookAvailable { get; set; } = true;

    [BsonElement("resetToken")]
    public string? ResetToken { get; set; }

    [BsonElement("resetTokenExpires")]
    public DateTime? ResetTokenExpires { get; set; }
}
