using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IReadingProgressRepository
    {
        Task<ReadingProgress?> GetByUserIdAndBookIdAsync(string userId, string bookId);
        Task UpsertAsync(ReadingProgress progress);
        Task BulkWriteAsync(List<ReadingProgress> progresses);
    }
}
