using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class CopyRepository : ICopyRepository
    {
        private readonly IMongoCollection<BookCopy> _collection;

        public CopyRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<BookCopy>("book_copies");
        }

        public async Task<BookCopy?> GetByIdAsync(string id)
        {
            var filter = Builders<BookCopy>.Filter.Eq(c => c.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<BookCopy>> GetByBookIdAsync(string bookId)
        {
            var filter = Builders<BookCopy>.Filter.Eq(c => c.BookId, bookId);
            return await _collection.Find(filter).ToListAsync();
        }

        public async Task<List<BookCopy>> GetByBranchIdAsync(string branchId)
        {
            var filter = Builders<BookCopy>.Filter.Eq(c => c.BranchId, branchId);
            return await _collection.Find(filter).ToListAsync();
        }

        public async Task<(List<BookCopy> Items, long Total)> SearchAsync(string? keyword, int page, int limit)
        {
            var filter = Builders<BookCopy>.Filter.Empty;
            
            if (!string.IsNullOrEmpty(keyword))
            {
                filter = Builders<BookCopy>.Filter.Or(
                    Builders<BookCopy>.Filter.Regex(c => c.Barcode, new MongoDB.Bson.BsonRegularExpression(keyword, "i")),
                    Builders<BookCopy>.Filter.Regex(c => c.ShelfCode, new MongoDB.Bson.BsonRegularExpression(keyword, "i"))
                );
            }

            var total = await _collection.CountDocumentsAsync(filter);
            var skip = (page - 1) * limit;
            var items = await _collection.Find(filter)
                .Skip(skip)
                .Limit(limit)
                .Sort(Builders<BookCopy>.Sort.Descending(c => c.CreatedAt))
                .ToListAsync();

            return (items, total);
        }

        public async Task InsertAsync(BookCopy copy)
        {
            await _collection.InsertOneAsync(copy);
        }

        public async Task UpdateAsync(string id, BookCopy copy)
        {
            var filter = Builders<BookCopy>.Filter.Eq(c => c.Id, id);
            await _collection.ReplaceOneAsync(filter, copy);
        }

        public async Task DeleteAsync(string id)
        {
            var filter = Builders<BookCopy>.Filter.Eq(c => c.Id, id);
            await _collection.DeleteOneAsync(filter);
        }

        public async Task<bool> ExistsByBarcodeAsync(string barcode)
        {
            var filter = Builders<BookCopy>.Filter.Eq(c => c.Barcode, barcode);
            return await _collection.Find(filter).AnyAsync();
        }

        public async Task<long> CountAvailableByBookIdAsync(string bookId)
        {
            var filter = Builders<BookCopy>.Filter.And(
                Builders<BookCopy>.Filter.Eq(c => c.BookId, bookId),
                Builders<BookCopy>.Filter.Eq(c => c.Status, "AVAILABLE")
            );
            return await _collection.CountDocumentsAsync(filter);
        }
    }
}