using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class BorrowingItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("borrowingId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BorrowingId { get; set; } = string.Empty;

    [BsonElement("copyId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string CopyId { get; set; } = string.Empty;

    [BsonElement("dueAt")]
    public DateTime DueAt { get; set; }

    [BsonElement("returnedAt")]
    public DateTime? ReturnedAt { get; set; }

    [BsonElement("renewCount")]
    public int RenewCount { get; set; } = 0;

    [BsonElement("conditionOut")]
    public string ConditionOut { get; set; } = "GOOD";

    [BsonElement("conditionIn")]
    public string? ConditionIn { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "BORROWED"; // BORROWED, RETURNED, OVERDUE, LOST, DAMAGED
}
