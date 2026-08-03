using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IBookRepository
    {
        Task<Book?> GetByIdAsync(string id);
        Task<Book?> GetBySlugAsync(string slug);
        Task<Book?> GetByISBNAsync(string isbn);
        Task<List<Book>> GetAllAsync();
        Task InsertAsync(Book book);
        Task UpdateAsync(string id, Book book);
        Task DeleteAsync(string id);
        Task<(List<Book> Items, long Total)> SearchAsync(
            string? keyword,
            string? categoryId,
            string? authorId,
            string? status,
            string? availability,
            string? accessType,
            int page,
            int limit,
            string sortBy = "createdAt",
            string sortOrder = "desc");
        Task<List<Book>> GetTrendingAsync(int limit);
        Task<List<Book>> GetNewReleasesAsync(int limit);
        Task<long> CountByStatusAsync(string status);
        Task IncrementViewCountAsync(string bookId);
        Task UpdateTotalChaptersAsync(string bookId, int count);
        Task<bool> ExistsBySlugAsync(string slug);
        Task<bool> ExistsByISBNAsync(string isbn);
    }
}