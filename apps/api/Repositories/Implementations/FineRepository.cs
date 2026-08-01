using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class FineRepository : IFineRepository
    {
        private readonly IMongoCollection<Fine> _collection;

        public FineRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<Fine>("fines");
        }

        public async Task<Fine?> GetByIdAsync(string id)
        {
            var filter = Builders<Fine>.Filter.Eq(f => f.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<Fine>> GetByUserIdAsync(string userId)
        {
            var filter = Builders<Fine>.Filter.Eq(f => f.UserId, userId);
            return await _collection.Find(filter).ToListAsync();
        }

        public async Task<List<Fine>> GetUnpaidByUserIdAsync(string userId)
        {
            var filter = Builders<Fine>.Filter.And(
                Builders<Fine>.Filter.Eq(f => f.UserId, userId),
                Builders<Fine>.Filter.Eq(f => f.Status, "UNPAID")
            );
            return await _collection.Find(filter).ToListAsync();
        }

        public async Task<decimal> GetTotalUnpaidAmountByUserIdAsync(string userId)
        {
            var unpaidFines = await GetUnpaidByUserIdAsync(userId);
            return unpaidFines.Sum(f => f.Amount);
        }

        public async Task<(List<Fine> Items, long Total)> SearchAsync(string? userId, string? status, string? reason, int page, int limit)
        {
            var builder = Builders<Fine>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrEmpty(userId))
            {
                filter &= builder.Eq(f => f.UserId, userId);
            }

            if (!string.IsNullOrEmpty(status))
            {
                filter &= builder.Eq(f => f.Status, status);
            }

            if (!string.IsNullOrEmpty(reason))
            {
                filter &= builder.Eq(f => f.Reason, reason);
            }

            var total = await _collection.CountDocumentsAsync(filter);
            var skip = (page - 1) * limit;
            var items = await _collection.Find(filter)
                .Skip(skip)
                .Limit(limit)
                .Sort(Builders<Fine>.Sort.Descending(f => f.CreatedAt))
                .ToListAsync();

            return (items, total);
        }

        public async Task InsertAsync(Fine fine)
        {
            await _collection.InsertOneAsync(fine);
        }

        public async Task UpdateAsync(string id, Fine fine)
        {
            var filter = Builders<Fine>.Filter.Eq(f => f.Id, id);
            await _collection.ReplaceOneAsync(filter, fine);
        }
    }
}
