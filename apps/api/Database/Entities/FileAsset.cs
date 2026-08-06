using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Database.Entities
{
    public class FileAsset
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("fileName")]
        public string FileName { get; set; } = string.Empty;

        [BsonElement("originalFileName")]
        public string OriginalFileName { get; set; } = string.Empty;

        [BsonElement("filePath")]
        public string FilePath { get; set; } = string.Empty;

        [BsonElement("fileUrl")]
        public string FileUrl { get; set; } = string.Empty;

        [BsonElement("fileType")]
        public string FileType { get; set; } = string.Empty; // COVER, PDF, EPUB, CONTENT, AVATAR

        [BsonElement("mimeType")]
        public string MimeType { get; set; } = string.Empty;

        [BsonElement("fileSize")]
        public long FileSize { get; set; }

        [BsonElement("cloudinaryPublicId")]
        public string CloudinaryPublicId { get; set; } = string.Empty;

        [BsonElement("width")]
        public int Width { get; set; }

        [BsonElement("height")]
        public int Height { get; set; }

        [BsonElement("format")]
        public string Format { get; set; } = string.Empty;

        [BsonElement("category")]
        public string Category { get; set; } = "general";

        [BsonElement("usageType")]
        public string UsageType { get; set; } = "generic-media";

        [BsonElement("bookId")]
        public string? BookId { get; set; }

        [BsonElement("chapterId")]
        public string? ChapterId { get; set; }

        [BsonElement("userId")]
        public string? UserId { get; set; }

        [BsonElement("isPublic")]
        public bool IsPublic { get; set; } = true;

        [BsonElement("description")]
        public string? Description { get; set; }

        [BsonElement("metadata")]
        public Dictionary<string, string>? Metadata { get; set; }

        [BsonElement("createdBy")]
        public string? CreatedBy { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum FileType
    {
        COVER,
        PDF,
        EPUB,
        CONTENT,
        AVATAR,
        ATTACHMENT
    }
}
