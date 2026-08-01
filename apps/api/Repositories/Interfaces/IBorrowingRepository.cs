using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IBorrowingRepository
    {
        Task<Borrowing?> GetByIdAsync(string id);
        Task<Borrowing?> GetByCodeAsync(string code);
        Task<List<BorrowingItem>> GetItemsByBorrowingIdAsync(string borrowingId);
        Task<BorrowingItem?> GetItemByIdAsync(string itemId);
        Task<List<BorrowingItem>> GetActiveItemsByUserIdAsync(string userId);
        Task<long> CountActiveItemsByUserIdAsync(string userId);
        Task<(List<Borrowing> Items, long Total)> SearchAsync(string? userId, string? branchId, string? status, string? keyword, int page, int limit);
        Task InsertAsync(Borrowing borrowing, List<BorrowingItem> items);
        Task UpdateBorrowingAsync(string id, Borrowing borrowing);
        Task UpdateBorrowingItemAsync(string itemId, BorrowingItem item);
        Task BulkUpdateBorrowingItemsAsync(List<BorrowingItem> items);
        Task<List<BorrowingItem>> GetOverdueItemsAsync();
    }
}
