using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface ICopyRepository
    {
        Task<BookCopy?> GetByIdAsync(string id);
        Task<List<BookCopy>> GetByBookIdAsync(string bookId);
        Task<List<BookCopy>> GetByBranchIdAsync(string branchId);
        Task<(List<BookCopy> Items, long Total)> SearchAsync(string? keyword, int page, int limit);
        Task InsertAsync(BookCopy copy);
        Task UpdateAsync(string id, BookCopy copy);
        Task DeleteAsync(string id);
        Task<bool> ExistsByBarcodeAsync(string barcode);
        Task<long> CountAvailableByBookIdAsync(string bookId);
    }
}