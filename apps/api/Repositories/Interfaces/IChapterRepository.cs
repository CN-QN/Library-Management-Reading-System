using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IChapterRepository
    {
        Task<Chapter?> GetByIdAsync(string id);
        Task<List<Chapter>> GetByBookIdAsync(string bookId);
        Task<Chapter?> GetByBookIdAndNumberAsync(string bookId, int number);  // Thêm
        Task<int> CountByBookIdAsync(string bookId);  // Thêm
        Task UpdateOrderAsync(string chapterId, int newOrder);  // Thêm
        Task<bool> ExistsAsync(string bookId, int number);  // Thêm
        Task InsertAsync(Chapter chapter);
        Task UpdateAsync(string id, Chapter chapter);
        Task DeleteAsync(string id);
    }
}
