using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class Fine
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("borrowingId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BorrowingId { get; set; } = string.Empty;

    [BsonElement("borrowingItemId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? BorrowingItemId { get; set; }

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("reason")]
    public string Reason { get; set; } = string.Empty; // OVERDUE, DAMAGED, LOST

    [BsonElement("status")]
    public string Status { get; set; } = "UNPAID"; // UNPAID, PAID, WAIVED, CANCELLED

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("paidAt")]
    public DateTime? PaidAt { get; set; }

    [BsonElement("waivedAt")]
    public DateTime? WaivedAt { get; set; }

    [BsonElement("waivedBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? WaivedBy { get; set; }

    [BsonElement("note")]
    public string? Note { get; set; }
}
