using api.Database.Entities;

namespace api.Repositories.Interfaces
{
    public interface ICategoryRepository
    {
        Task<Category?> GetByIdAsync(string id);
        Task<Category?> GetBySlugAsync(string slug);
        Task<List<Category>> GetAllAsync();
        Task<List<Category>> GetChildrenAsync(string parentId);
        Task InsertAsync(Category category);
        Task UpdateAsync(string id, Category category);
        Task DeleteAsync(string id);
        Task<bool> ExistsBySlugAsync(string slug);
        Task<List<Category>> GetByIdsAsync(List<string> ids); // [THÊM]
    }
}
