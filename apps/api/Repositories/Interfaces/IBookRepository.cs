using api.Database.Entities;
using MongoDB.Driver;

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

        // Embedded chapter methods
        Task<BookChapter?> GetChapterByIdAsync(string bookId, string chapterId);
        Task<List<BookChapter>> GetChaptersByBookIdAsync(string bookId);
        Task<BookChapter?> GetChapterByNumberAsync(string bookId, int number);
        Task<bool> AddChapterAsync(string bookId, BookChapter chapter);
        Task<bool> ReplaceChapterAsync(string bookId, string chapterId, BookChapter chapter);
        Task<bool> UpdateChapterAsync(string bookId, string chapterId, UpdateDefinition<Book> update);
        Task<bool> ReplaceChaptersAsync(string bookId, IReadOnlyList<BookChapter> chapters);
        Task<bool> ArchiveChapterAsync(string bookId, string chapterId);
    }
}