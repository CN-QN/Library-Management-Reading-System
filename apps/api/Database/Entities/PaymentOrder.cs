using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class PaymentOrder
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("orderCode")]
    public string OrderCode { get; set; } = string.Empty;

    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("bookId")]
    public string BookId { get; set; } = string.Empty;

    [BsonElement("bookTitle")]
    public string BookTitle { get; set; } = string.Empty;

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "PENDING"; // PENDING, SUCCESS, FAILED, EXPIRED

    [BsonElement("qrCodeUrl")]
    public string QrCodeUrl { get; set; } = string.Empty;

    [BsonElement("paymentContent")]
    public string PaymentContent { get; set; } = string.Empty;

    [BsonElement("sePayTransactionId")]
    public string? SePayTransactionId { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("paidAt")]
    public DateTime? PaidAt { get; set; }
}
