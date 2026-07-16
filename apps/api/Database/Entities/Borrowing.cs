using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class Borrowing
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("code")]
    public string Code { get; set; } = string.Empty; // unique transaction code e.g. "LOAN-2026-0001"

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("branchId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BranchId { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "OPEN"; // OPEN, RETURNED, OVERDUE, CANCELLED

    [BsonElement("borrowedAt")]
    public DateTime BorrowedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("expectedReturnAt")]
    public DateTime ExpectedReturnAt { get; set; } // Due date

    [BsonElement("closedAt")]
    public DateTime? ClosedAt { get; set; }

    [BsonElement("createdBy")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string CreatedBy { get; set; } = string.Empty; // Staff who issued the loan

    [BsonElement("note")]
    public string? Note { get; set; }
}
