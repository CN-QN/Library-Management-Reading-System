using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IReservationRepository
    {
        Task<Reservation?> GetByIdAsync(string id);
        Task<List<Reservation>> GetActiveByBookIdAsync(string bookId);
        Task<Reservation?> GetActiveByUserIdAndBookIdAsync(string userId, string bookId);
        Task<int> GetNextQueuePositionAsync(string bookId);
        Task<(List<Reservation> Items, long Total)> SearchAsync(string? userId, string? bookId, string? branchId, string? status, int page, int limit);
        Task InsertAsync(Reservation reservation);
        Task UpdateAsync(string id, Reservation reservation);
        Task UpdateQueuePositionsAsync(string bookId);
        Task<List<Reservation>> GetExpiredReadyReservationsAsync();
    }
}
