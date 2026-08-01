using MongoDB.Bson; 
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
namespace api.Modules.Inventory.DTOs
{
    public class InventoryAuditRequestDto
    {
        public string BookCopyId { get; set; } = string.Empty;
        public int ActualQuantity { get; set; }
        public string? Note { get; set; }
    }
}