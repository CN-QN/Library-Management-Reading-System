using MongoDB.Bson; 
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
namespace api.Modules.Inventory.DTOs
{
    public class MarkFoundRequestDto
    {
        public string BookCopyId { get; set; } = string.Empty;
        public string? Note { get; set; }
    }
}
