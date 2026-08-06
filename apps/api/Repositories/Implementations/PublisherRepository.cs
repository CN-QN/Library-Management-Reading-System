using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class PublisherRepository : IPublisherRepository
    {
        private readonly IMongoCollection<Publisher> _collection;

        public PublisherRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<Publisher>("publishers");
        }

        public async Task<Publisher?> GetByIdAsync(string id)
        {
            var filter = Builders<Publisher>.Filter.Eq(p => p.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Publisher?> GetBySlugAsync(string slug)
        {
            var filter = Builders<Publisher>.Filter.Eq(p => p.Slug, slug);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<Publisher>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task InsertAsync(Publisher publisher)
        {
            await _collection.InsertOneAsync(publisher);
        }

        public async Task UpdateAsync(string id, Publisher publisher)
        {
            var filter = Builders<Publisher>.Filter.Eq(p => p.Id, id);
            await _collection.ReplaceOneAsync(filter, publisher);
        }

        public async Task DeleteAsync(string id)
        {
            var filter = Builders<Publisher>.Filter.Eq(p => p.Id, id);
            await _collection.DeleteOneAsync(filter);
        }

        public async Task<bool> ExistsBySlugAsync(string slug)
        {
            var filter = Builders<Publisher>.Filter.Eq(p => p.Slug, slug);
            return await _collection.Find(filter).AnyAsync();
        }
    }
}
