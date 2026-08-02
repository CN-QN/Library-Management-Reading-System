using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class Reservation
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

    [BsonElement("branchId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BranchId { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "WAITING"; // WAITING, READY, FULFILLED, CANCELLED, EXPIRED

    [BsonElement("queuePosition")]
    public int QueuePosition { get; set; } = 1;

    [BsonElement("reservedAt")]
    public DateTime ReservedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("readyUntil")]
    public DateTime? ReadyUntil { get; set; } // Hold expiry when copy becomes ready

    [BsonElement("fulfilledAt")]
    public DateTime? FulfilledAt { get; set; }

    [BsonElement("cancelledAt")]
    public DateTime? CancelledAt { get; set; }

    [BsonElement("note")]
    public string? Note { get; set; }
}
