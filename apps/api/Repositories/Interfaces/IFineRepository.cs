using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IFineRepository
    {
        Task<Fine?> GetByIdAsync(string id);
        Task<List<Fine>> GetByUserIdAsync(string userId);
        Task<List<Fine>> GetUnpaidByUserIdAsync(string userId);
        Task<decimal> GetTotalUnpaidAmountByUserIdAsync(string userId);
        Task<(List<Fine> Items, long Total)> SearchAsync(string? userId, string? status, string? reason, int page, int limit);
        Task InsertAsync(Fine fine);
        Task UpdateAsync(string id, Fine fine);
    }
}
