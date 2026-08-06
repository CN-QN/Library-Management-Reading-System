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

        // [THÊM MỚI] Lấy chapter theo BookId và Number
        public async Task<Chapter?> GetByBookIdAndNumberAsync(string bookId, int number)
        {
            var filter = Builders<Chapter>.Filter.And(
                Builders<Chapter>.Filter.Eq(c => c.BookId, bookId),
                Builders<Chapter>.Filter.Eq(c => c.Number, number)
            );
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        // [THÊM MỚI] Đếm số chapter của một sách
        public async Task<int> CountByBookIdAsync(string bookId)
        {
            var filter = Builders<Chapter>.Filter.Eq(c => c.BookId, bookId);
            return (int)await _collection.CountDocumentsAsync(filter);
        }

        // [THÊM MỚI] Cập nhật thứ tự chapter
        public async Task UpdateOrderAsync(string chapterId, int newOrder)
        {
            var filter = Builders<Chapter>.Filter.Eq(c => c.Id, chapterId);
            var update = Builders<Chapter>.Update.Set(c => c.Number, newOrder);
            await _collection.UpdateOneAsync(filter, update);
        }

        // [THÊM MỚI] Kiểm tra chapter đã tồn tại
        public async Task<bool> ExistsAsync(string bookId, int number)
        {
            var filter = Builders<Chapter>.Filter.And(
                Builders<Chapter>.Filter.Eq(c => c.BookId, bookId),
                Builders<Chapter>.Filter.Eq(c => c.Number, number)
            );
            return await _collection.Find(filter).AnyAsync();
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
    }
}
