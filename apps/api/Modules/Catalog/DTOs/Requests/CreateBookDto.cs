using MongoDB.Bson; 
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
namespace api.Modules.Catalog.DTOs.Requests
{
    public class CreateBookDto
    {
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ISBN { get; set; }
        public string? Summary { get; set; }
        public string? PublisherId { get; set; }
        public int? PublicationYear { get; set; }
        public string? Language { get; set; }
        public string? AccessType { get; set; }
        public List<string> AuthorIds { get; set; } = new();
        public List<string> CategoryIds { get; set; } = new();
    }
}