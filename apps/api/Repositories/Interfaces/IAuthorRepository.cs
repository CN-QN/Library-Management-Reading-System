using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface IAuthorRepository
    {
        Task<Author?> GetByIdAsync(string id);
        Task<Author?> GetBySlugAsync(string slug);
        Task<List<Author>> GetAllAsync();
        Task InsertAsync(Author author);
        Task UpdateAsync(string id, Author author);
        Task DeleteAsync(string id);
        Task<bool> ExistsBySlugAsync(string slug);
        Task<List<Author>> GetByIdsAsync(List<string> ids); // [THÊM]
    }
}