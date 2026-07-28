using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IChapterRepository
    {
        Task<Chapter?> GetByIdAsync(string id);
        Task<List<Chapter>> GetByBookIdAsync(string bookId);
        Task<Chapter?> GetByBookAndNumberAsync(string bookId, int number);
        Task<List<Chapter>> GetPublishedChaptersAsync(string bookId);
        Task InsertAsync(Chapter chapter);
        Task UpdateAsync(string id, Chapter chapter);
        Task DeleteAsync(string id);
        Task<bool> ExistsByNumberAsync(string bookId, int number);
    }
}