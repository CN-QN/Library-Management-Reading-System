using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class BookCopy
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("bookId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BookId { get; set; } = string.Empty;

    [BsonElement("branchId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string BranchId { get; set; } = string.Empty;

    [BsonElement("barcode")]
    public string Barcode { get; set; } = string.Empty; // unique barcode

    [BsonElement("shelfCode")]
    public string ShelfCode { get; set; } = string.Empty; // e.g. "A-12"

    [BsonElement("condition")]
    public string Condition { get; set; } = "NEW"; // NEW, GOOD, DAMAGED, LOST

    [BsonElement("status")]
    public string Status { get; set; } = "AVAILABLE"; // AVAILABLE, BORROWED, RESERVED, LOST, DAMAGED, MAINTENANCE

    [BsonElement("acquiredAt")]
    public DateTime AcquiredAt { get; set; } = DateTime.UtcNow;

    [BsonElement("lastInventoryAt")]
    public DateTime? LastInventoryAt { get; set; }
}
