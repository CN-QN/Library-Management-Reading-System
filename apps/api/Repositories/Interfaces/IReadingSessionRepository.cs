using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IReadingSessionRepository
    {
        Task<ReadingSession?> GetBySessionIdAsync(string sessionId);
        Task InsertAsync(ReadingSession session);
        Task UpdateAsync(ReadingSession session);
    }
}
