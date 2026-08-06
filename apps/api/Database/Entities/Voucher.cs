using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class Voucher
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("code")]
    public string Code { get; set; } = string.Empty;

    [BsonElement("discountType")]
    public string DiscountType { get; set; } = "PERCENT"; // PERCENT | FIXED

    [BsonElement("discountValue")]
    public decimal DiscountValue { get; set; } = 50;

    [BsonElement("minOrderValue")]
    public decimal MinOrderValue { get; set; } = 10000;

    [BsonElement("maxUsage")]
    public int MaxUsage { get; set; } = 100;

    [BsonElement("usedCount")]
    public int UsedCount { get; set; } = 0;

    [BsonElement("expiresAt")]
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMonths(3);

    [BsonElement("status")]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE | EXPIRED

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
