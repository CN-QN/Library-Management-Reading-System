using MongoDB.Bson; 
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
namespace api.Modules.Catalog.DTOs.Requests
{
    public class UpdateBookDto
    {
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public string? PublisherId { get; set; }
        public int? PublicationYear { get; set; }
        public string? Language { get; set; }
        public string? AccessType { get; set; }
        
        public List<string>? CategoryIds { get; set; }
        public List<string>? AuthorIds { get; set; }
    }
}