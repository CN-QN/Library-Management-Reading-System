using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class ChapterRepository : IChapterRepository
    {
        private readonly IMongoCollection<Chapter> _collection;

        public ChapterRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<Chapter>("chapters");
        }

        public async Task<Chapter?> GetByIdAsync(string id)
        {
            var filter = Builders<Chapter>.Filter.Eq(c => c.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<Chapter>> GetByBookIdAsync(string bookId)
        {
            var filter = Builders<Chapter>.Filter.Eq(c => c.BookId, bookId);
            return await _collection.Find(filter)
                .Sort(Builders<Chapter>.Sort.Ascending(c => c.Number))
                .ToListAsync();
        }

        public async Task<Chapter?> GetByBookAndNumberAsync(string bookId, int number)
        {
            var filter = Builders<Chapter>.Filter.And(
                Builders<Chapter>.Filter.Eq(c => c.BookId, bookId),
                Builders<Chapter>.Filter.Eq(c => c.Number, number)
            );
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<Chapter>> GetPublishedChaptersAsync(string bookId)
        {
            var filter = Builders<Chapter>.Filter.And(
                Builders<Chapter>.Filter.Eq(c => c.BookId, bookId),
                Builders<Chapter>.Filter.Eq(c => c.Status, "PUBLISHED")
            );
            return await _collection.Find(filter)
                .Sort(Builders<Chapter>.Sort.Ascending(c => c.Number))
                .ToListAsync();
        }

        public async Task InsertAsync(Chapter chapter)
        {
            await _collection.InsertOneAsync(chapter);
        }

        public async Task UpdateAsync(string id, Chapter chapter)
        {
            var filter = Builders<Chapter>.Filter.Eq(c => c.Id, id);
            await _collection.ReplaceOneAsync(filter, chapter);
        }

        public async Task DeleteAsync(string id)
        {
            var filter = Builders<Chapter>.Filter.Eq(c => c.Id, id);
            await _collection.DeleteOneAsync(filter);
        }

        public async Task<bool> ExistsByNumberAsync(string bookId, int number)
        {
            var filter = Builders<Chapter>.Filter.And(
                Builders<Chapter>.Filter.Eq(c => c.BookId, bookId),
                Builders<Chapter>.Filter.Eq(c => c.Number, number)
            );
            return await _collection.Find(filter).AnyAsync();
        }
    }
}