using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly IMongoCollection<Category> _collection;

        public CategoryRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<Category>("categories");
        }

        public async Task<Category?> GetByIdAsync(string id)
        {
            var filter = Builders<Category>.Filter.Eq(c => c.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Category?> GetBySlugAsync(string slug)
        {
            var filter = Builders<Category>.Filter.Eq(c => c.Slug, slug);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<Category>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task<List<Category>> GetChildrenAsync(string parentId)
        {
            var filter = Builders<Category>.Filter.Eq(c => c.ParentId, parentId);
            return await _collection.Find(filter).ToListAsync();
        }

        public async Task InsertAsync(Category category)
        {
            await _collection.InsertOneAsync(category);
        }

        public async Task UpdateAsync(string id, Category category)
        {
            var filter = Builders<Category>.Filter.Eq(c => c.Id, id);
            await _collection.ReplaceOneAsync(filter, category);
        }

        public async Task DeleteAsync(string id)
        {
            var filter = Builders<Category>.Filter.Eq(c => c.Id, id);
            await _collection.DeleteOneAsync(filter);
        }

        public async Task<bool> ExistsBySlugAsync(string slug)
        {
            var filter = Builders<Category>.Filter.Eq(c => c.Slug, slug);
            return await _collection.Find(filter).AnyAsync();
        }

        // [THÊM MỚI] Lấy nhiều thể loại theo danh sách ID
        public async Task<List<Category>> GetByIdsAsync(List<string> ids)
        {
            if (ids == null || !ids.Any())
                return new List<Category>();

            var filter = Builders<Category>.Filter.In(c => c.Id, ids);
            return await _collection.Find(filter).ToListAsync();
        }
    }
}
