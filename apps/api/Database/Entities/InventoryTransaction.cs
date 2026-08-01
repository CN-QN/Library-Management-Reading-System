using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities
{
    public class InventoryTransaction
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("bookCopyId")]
        public string BookCopyId { get; set; } = string.Empty;

        [BsonElement("bookId")]
        public string BookId { get; set; } = string.Empty;

        [BsonElement("bookTitle")]
        public string BookTitle { get; set; } = string.Empty;

        [BsonElement("transactionType")]
        public string TransactionType { get; set; } = string.Empty; // IMPORT, TRANSFER, AUDIT, RETURN, LOST, FOUND

        [BsonElement("quantity")]
        public int Quantity { get; set; } = 1;

        [BsonElement("fromLocation")]
        public string? FromLocation { get; set; } // BranchId hoặc Warehouse

        [BsonElement("toLocation")]
        public string? ToLocation { get; set; } // BranchId hoặc Warehouse

        [BsonElement("fromBranchName")]
        public string? FromBranchName { get; set; }

        [BsonElement("toBranchName")]
        public string? ToBranchName { get; set; }

        [BsonElement("status")]
        public string Status { get; set; } = "COMPLETED"; // PENDING, COMPLETED, CANCELLED

        [BsonElement("note")]
        public string? Note { get; set; }

        [BsonElement("referenceId")]
        public string? ReferenceId { get; set; } // ID của BorrowingRecord, PurchaseOrder, etc.

        [BsonElement("referenceType")]
        public string? ReferenceType { get; set; } // BORROWING, PURCHASE, AUDIT

        [BsonElement("performedBy")]
        public string PerformedBy { get; set; } = string.Empty;

        [BsonElement("performedByName")]
        public string? PerformedByName { get; set; }

        [BsonElement("performedAt")]
        public DateTime PerformedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("metadata")]
        public Dictionary<string, string>? Metadata { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum InventoryTransactionType
    {
        IMPORT,      // Nhập kho
        TRANSFER,    // Chuyển kho
        AUDIT,       // Kiểm kê
        RETURN,      // Trả sách
        LOST,        // Mất sách
        FOUND,       // Tìm thấy sách
        DAMAGED,     // Sách hỏng
        REPAIR       // Sửa chữa
    }

    public enum InventoryTransactionStatus
    {
        PENDING,
        COMPLETED,
        CANCELLED
    }
}