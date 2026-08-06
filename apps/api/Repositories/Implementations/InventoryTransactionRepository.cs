using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
namespace api.Repositories.Implementations
{
    public class InventoryTransactionRepository : IInventoryTransactionRepository
    {
        private readonly IMongoCollection<InventoryTransaction> _collection;

        public InventoryTransactionRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<InventoryTransaction>("inventoryTransactions");
        }

        public async Task<InventoryTransaction?> GetByIdAsync(string id)
        {
            var filter = Builders<InventoryTransaction>.Filter.Eq(t => t.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task InsertAsync(InventoryTransaction transaction)
        {
            await _collection.InsertOneAsync(transaction);
        }

        public async Task UpdateAsync(string id, InventoryTransaction transaction)
        {
            var filter = Builders<InventoryTransaction>.Filter.Eq(t => t.Id, id);
            await _collection.ReplaceOneAsync(filter, transaction);
        }

        public async Task DeleteAsync(string id)
        {
            var filter = Builders<InventoryTransaction>.Filter.Eq(t => t.Id, id);
            await _collection.DeleteOneAsync(filter);
        }

        public async Task<(List<InventoryTransaction> Items, long Total)> SearchAsync(
            string? bookCopyId,
            string? bookId,
            string? transactionType,
            string? status,
            string? fromLocation,
            string? toLocation,
            string? performedBy,
            DateTime? fromDate,
            DateTime? toDate,
            string? keyword,
            int page,
            int limit,
            string? sortBy,
            bool descending)
        {
            var filterBuilder = Builders<InventoryTransaction>.Filter;
            var filters = new List<FilterDefinition<InventoryTransaction>>();

            if (!string.IsNullOrEmpty(bookCopyId))
                filters.Add(filterBuilder.Eq(t => t.BookCopyId, bookCopyId));

            if (!string.IsNullOrEmpty(bookId))
                filters.Add(filterBuilder.Eq(t => t.BookId, bookId));

            if (!string.IsNullOrEmpty(transactionType))
                filters.Add(filterBuilder.Eq(t => t.TransactionType, transactionType));

            if (!string.IsNullOrEmpty(status))
                filters.Add(filterBuilder.Eq(t => t.Status, status));

            if (!string.IsNullOrEmpty(fromLocation))
                filters.Add(filterBuilder.Eq(t => t.FromLocation, fromLocation));

            if (!string.IsNullOrEmpty(toLocation))
                filters.Add(filterBuilder.Eq(t => t.ToLocation, toLocation));

            if (!string.IsNullOrEmpty(performedBy))
                filters.Add(filterBuilder.Eq(t => t.PerformedBy, performedBy));

            if (fromDate.HasValue)
                filters.Add(filterBuilder.Gte(t => t.PerformedAt, fromDate.Value));

            if (toDate.HasValue)
                filters.Add(filterBuilder.Lte(t => t.PerformedAt, toDate.Value));

            if (!string.IsNullOrEmpty(keyword))
            {
                var keywordFilter = filterBuilder.Regex(t => t.BookTitle, new BsonRegularExpression(keyword, "i")) |
                                    filterBuilder.Regex(t => t.Note, new BsonRegularExpression(keyword, "i"));
                filters.Add(keywordFilter);
            }

            var filter = filters.Any() ? filterBuilder.And(filters) : filterBuilder.Empty;
            var total = await _collection.CountDocumentsAsync(filter);

            var sortDefinition = descending
                ? Builders<InventoryTransaction>.Sort.Descending(sortBy ?? "performedAt")
                : Builders<InventoryTransaction>.Sort.Ascending(sortBy ?? "performedAt");

            var items = await _collection.Find(filter)
                .Sort(sortDefinition)
                .Skip((page - 1) * limit)
                .Limit(limit)
                .ToListAsync();

            return (items, total);
        }

        public async Task<List<InventoryTransaction>> GetByBookCopyIdAsync(string bookCopyId)
        {
            var filter = Builders<InventoryTransaction>.Filter.Eq(t => t.BookCopyId, bookCopyId);
            return await _collection.Find(filter)
                .Sort(Builders<InventoryTransaction>.Sort.Descending(t => t.PerformedAt))
                .ToListAsync();
        }

        public async Task<List<InventoryTransaction>> GetByBookIdAsync(string bookId)
        {
            var filter = Builders<InventoryTransaction>.Filter.Eq(t => t.BookId, bookId);
            return await _collection.Find(filter)
                .Sort(Builders<InventoryTransaction>.Sort.Descending(t => t.PerformedAt))
                .ToListAsync();
        }

        public async Task<Dictionary<string, long>> GetTransactionStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var filterBuilder = Builders<InventoryTransaction>.Filter;
            var filters = new List<FilterDefinition<InventoryTransaction>>();

            if (fromDate.HasValue)
                filters.Add(filterBuilder.Gte(t => t.PerformedAt, fromDate.Value));

            if (toDate.HasValue)
                filters.Add(filterBuilder.Lte(t => t.PerformedAt, toDate.Value));

            var filter = filters.Any() ? filterBuilder.And(filters) : filterBuilder.Empty;

            var pipeline = new List<BsonDocument>
            {
                new BsonDocument("$match", filter.Render(BsonSerializer.SerializerRegistry.GetSerializer<InventoryTransaction>(), BsonSerializer.SerializerRegistry)),
                new BsonDocument("$group", new BsonDocument
                {
                    { "_id", "$transactionType" },
                    { "count", new BsonDocument("$sum", 1) }
                })
            };

            var result = await _collection.Aggregate<BsonDocument>(pipeline).ToListAsync();
            
            var statistics = new Dictionary<string, long>();
            foreach (var doc in result)
            {
                var type = doc["_id"].AsString;
                var count = doc["count"].AsInt64;
                statistics[type] = count;
            }

            return statistics;
        }
    }
}
