using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IPublisherRepository
    {
        Task<Publisher?> GetByIdAsync(string id);
        Task<Publisher?> GetBySlugAsync(string slug);
        Task<List<Publisher>> GetAllAsync();
        Task InsertAsync(Publisher publisher);
        Task UpdateAsync(string id, Publisher publisher);
        Task DeleteAsync(string id);
        Task<bool> ExistsBySlugAsync(string slug);
    }
}
