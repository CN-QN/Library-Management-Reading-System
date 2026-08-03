using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities
{
    public class Review
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("bookId")]
        public string BookId { get; set; } = string.Empty;

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("userFullName")]
        public string UserFullName { get; set; } = string.Empty;

        [BsonElement("userEmail")]
        public string UserEmail { get; set; } = string.Empty;

        [BsonElement("userAvatarUrl")]
        public string? UserAvatarUrl { get; set; }

        [BsonElement("rating")]
        public int Rating { get; set; } // 1 to 5

        [BsonElement("comment")]
        public string Comment { get; set; } = string.Empty;

        [BsonElement("status")]
        public string Status { get; set; } = "APPROVED"; // APPROVED, HIDDEN, REJECTED

        [BsonElement("isEdited")]
        public bool IsEdited { get; set; } = false;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
