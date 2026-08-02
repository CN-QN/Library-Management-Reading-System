using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class AuthorRepository : IAuthorRepository
    {
        private readonly IMongoCollection<Author> _collection;

        public AuthorRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<Author>("authors");
        }

        public async Task<Author?> GetByIdAsync(string id)
        {
            var filter = Builders<Author>.Filter.Eq(a => a.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Author?> GetBySlugAsync(string slug)
        {
            var filter = Builders<Author>.Filter.Eq(a => a.Slug, slug);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<Author>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task InsertAsync(Author author)
        {
            await _collection.InsertOneAsync(author);
        }

        public async Task UpdateAsync(string id, Author author)
        {
            var filter = Builders<Author>.Filter.Eq(a => a.Id, id);
            await _collection.ReplaceOneAsync(filter, author);
        }

        public async Task DeleteAsync(string id)
        {
            var filter = Builders<Author>.Filter.Eq(a => a.Id, id);
            await _collection.DeleteOneAsync(filter);
        }

        public async Task<bool> ExistsBySlugAsync(string slug)
        {
            var filter = Builders<Author>.Filter.Eq(a => a.Slug, slug);
            return await _collection.Find(filter).AnyAsync();
        }

        // [THÊM MỚI] Lấy nhiều tác giả theo danh sách ID
        public async Task<List<Author>> GetByIdsAsync(List<string> ids)
        {
            if (ids == null || !ids.Any())
                return new List<Author>();

            var filter = Builders<Author>.Filter.In(a => a.Id, ids);
            return await _collection.Find(filter).ToListAsync();
        }
    }
}