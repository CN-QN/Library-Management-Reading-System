using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IReadingProgressRepository
    {
        Task<ReadingProgress?> GetByUserIdAndBookIdAsync(string userId, string bookId);
        Task<List<ReadingProgress>> GetByUserIdAsync(string userId);
        Task UpsertAsync(ReadingProgress progress);
        Task BulkWriteAsync(List<ReadingProgress> progresses);
    }
}
