using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities
{
    public class LibraryBranch
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("code")]
        public string? Code { get; set; }

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("address")]
        public string? Address { get; set; }

        [BsonElement("contact")]
        public string? Contact { get; set; }

        [BsonElement("phone")]
        public string? Phone { get; set; }

        [BsonElement("status")]
        public string Status { get; set; } = "ACTIVE";

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}