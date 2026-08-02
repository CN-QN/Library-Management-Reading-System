using MongoDB.Bson; 
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
namespace api.Modules.Catalog.DTOs.Responses  // Đổi thành namespace này
{
    public class BookResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ISBN { get; set; }
        public string? Summary { get; set; }
        public string? PublisherName { get; set; }
        public int? PublicationYear { get; set; }
        public string Language { get; set; } = "vi";
        public string AccessType { get; set; } = "FREE";
        public string Status { get; set; } = "DRAFT";
        public string? CoverAssetId { get; set; }
        public int TotalChapters { get; set; }
        public int ViewCount { get; set; }
        public double Rating { get; set; }
        public List<string> CategoryIds { get; set; } = new();
        public List<string> AuthorIds { get; set; } = new();
        public List<string> AuthorNames { get; set; } = new();
        public List<string> CategoryNames { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}