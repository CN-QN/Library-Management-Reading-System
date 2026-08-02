using MongoDB.Bson; 
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
namespace api.Modules.Inventory.DTOs
{
    public class CancelTransactionRequestDto
    {
        public string? Reason { get; set; }
    }
}