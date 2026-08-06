using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class FlashSale
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("originalPrice")]
    public decimal OriginalPrice { get; set; } = 10000;

    [BsonElement("salePrice")]
    public decimal SalePrice { get; set; } = 5000;

    [BsonElement("startTime")]
    public DateTime StartTime { get; set; } = DateTime.UtcNow;

    [BsonElement("endTime")]
    public DateTime EndTime { get; set; } = DateTime.UtcNow.AddDays(7);

    [BsonElement("status")]
    public string Status { get; set; } = "RUNNING"; // RUNNING | UPCOMING | ENDED

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
