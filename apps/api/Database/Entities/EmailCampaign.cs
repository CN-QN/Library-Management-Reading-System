using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities;

public sealed class EmailCampaign
{
    [BsonId, BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; } = string.Empty;
    [BsonElement("subject")] public string Subject { get; set; } = string.Empty;
    [BsonElement("body")] public string Body { get; set; } = string.Empty;
    [BsonElement("campaignType")] public string CampaignType { get; set; } = "NEW_BOOKS";
    [BsonElement("status")] public string Status { get; set; } = "DRAFT";
    [BsonElement("createdBy")] public string CreatedBy { get; set; } = string.Empty;
    [BsonElement("recipientCount")] public int RecipientCount { get; set; }
    [BsonElement("sentCount")] public int SentCount { get; set; }
    [BsonElement("failedCount")] public int FailedCount { get; set; }
    [BsonElement("failureSummary")] public string? FailureSummary { get; set; }
    [BsonElement("createdAt")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [BsonElement("sentAt")] public DateTime? SentAt { get; set; }
}
