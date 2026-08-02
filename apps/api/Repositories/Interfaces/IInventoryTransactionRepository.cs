using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IInventoryTransactionRepository
    {
        Task<InventoryTransaction?> GetByIdAsync(string id);
        Task InsertAsync(InventoryTransaction transaction);
        Task UpdateAsync(string id, InventoryTransaction transaction);
        Task DeleteAsync(string id);
        Task<(List<InventoryTransaction> Items, long Total)> SearchAsync(
            string? bookCopyId,
            string? bookId,
            string? transactionType,
            string? status,
            string? fromLocation,
            string? toLocation,
            string? performedBy,
            DateTime? fromDate,
            DateTime? toDate,
            string? keyword,
            int page,
            int limit,
            string? sortBy,
            bool descending);
        Task<List<InventoryTransaction>> GetByBookCopyIdAsync(string bookCopyId);
        Task<List<InventoryTransaction>> GetByBookIdAsync(string bookId);
        Task<Dictionary<string, long>> GetTransactionStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);
    }
}