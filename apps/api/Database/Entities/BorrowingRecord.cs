using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities
{
    public class BorrowingRecord
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("bookCopyId")]
        public string BookCopyId { get; set; } = string.Empty;

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("borrowDate")]
        public DateTime BorrowDate { get; set; } = DateTime.UtcNow;

        [BsonElement("dueDate")]
        public DateTime DueDate { get; set; }

        [BsonElement("returnDate")]
        public DateTime? ReturnDate { get; set; }

        [BsonElement("status")]
        public string Status { get; set; } = "ACTIVE"; // ACTIVE, RETURNED, OVERDUE, LOST

        [BsonElement("fineAmount")]
        public decimal FineAmount { get; set; }

        [BsonElement("note")]
        public string? Note { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // ===== CÁC PROPERTY THÊM =====
        [BsonElement("bookId")]
        public string? BookId { get; set; }

        [BsonElement("bookTitle")]
        public string? BookTitle { get; set; }

        [BsonElement("userName")]
        public string? UserName { get; set; }

        [BsonElement("userEmail")]
        public string? UserEmail { get; set; }

        [BsonElement("createdBy")]
        public string? CreatedBy { get; set; }

        [BsonElement("maxRenewCount")]
        public int MaxRenewCount { get; set; } = 2;

        [BsonElement("renewCount")]
        public int RenewCount { get; set; }

        [BsonElement("finePaid")]
        public bool FinePaid { get; set; }
    }
}