using MongoDB.Bson; 
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
namespace api.Modules.Catalog.DTOs.Requests
{
    public class BookQueryDto
    {
        public string? Keyword { get; set; }
        public string? CategoryId { get; set; }
        public string? AuthorId { get; set; }
        public string? Status { get; set; }
        public string? AccessType { get; set; }
        public string? Availability { get; set; }
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public string SortBy { get; set; } = "createdAt";
        public string SortOrder { get; set; } = "desc";
    }
}