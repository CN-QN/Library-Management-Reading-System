using MongoDB.Bson; 
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
namespace api.Modules.Inventory.DTOs
{
    public class InventoryTransactionQueryDto
    {
        public string? BookCopyId { get; set; }
        public string? BookId { get; set; }
        public string? TransactionType { get; set; }
        public string? Status { get; set; }
        public string? FromLocation { get; set; }
        public string? ToLocation { get; set; }
        public string? PerformedBy { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? Keyword { get; set; }
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 20;
        public string? SortBy { get; set; } = "performedAt";
        public bool Descending { get; set; } = true;
    }
}