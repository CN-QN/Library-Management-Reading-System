using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public class UserBookAccess
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("bookId")]
    public string BookId { get; set; } = string.Empty;

    [BsonElement("paymentOrderId")]
    public string PaymentOrderId { get; set; } = string.Empty;

    [BsonElement("grantedAt")]
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
}
