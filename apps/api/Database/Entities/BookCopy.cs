using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities
{
    public class BookCopy
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("bookId")]
        public string BookId { get; set; } = string.Empty;

        [BsonElement("branchId")]
        public string BranchId { get; set; } = string.Empty;

        [BsonElement("barcode")]
        public string Barcode { get; set; } = string.Empty;

        [BsonElement("shelfCode")]
        public string? ShelfCode { get; set; }

        [BsonElement("condition")]
        public string Condition { get; set; } = "GOOD";

        [BsonElement("status")]
        public string Status { get; set; } = "AVAILABLE";

        [BsonElement("acquiredAt")]
        public DateTime AcquiredAt { get; set; } = DateTime.UtcNow;

        [BsonElement("price")]
        public decimal Price { get; set; }

        [BsonElement("lastInventoryAt")]
        public DateTime? LastInventoryAt { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}