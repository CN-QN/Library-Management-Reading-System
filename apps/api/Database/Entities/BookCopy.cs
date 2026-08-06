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

        [BsonElement("barcode")]
        public string Barcode { get; set; } = string.Empty;

        [BsonElement("status")]
        public string Status { get; set; } = "AVAILABLE"; // AVAILABLE, BORROWED, LOST, DAMAGED

        [BsonElement("condition")]
        public string Condition { get; set; } = "GOOD"; // GOOD, DAMAGED, LOST

        [BsonElement("currentBranchId")]
        public string? CurrentBranchId { get; set; }

        [BsonElement("currentBorrowingId")]
        public string? CurrentBorrowingId { get; set; }

        [BsonElement("location")]
        public string? Location { get; set; }

        [BsonElement("notes")]
        public string? Notes { get; set; }

        // ===== CÁC PROPERTY THÊM CHO SEED DATA =====
        [BsonElement("branchId")]
        public string? BranchId { get; set; }

        [BsonElement("shelfCode")]
        public string? ShelfCode { get; set; }

        [BsonElement("price")]
        public decimal? Price { get; set; }

        [BsonElement("acquiredAt")]
        public DateTime? AcquiredAt { get; set; }

        [BsonElement("lastInventoryAt")]
        public DateTime? LastInventoryAt { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
