using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace api.Repositories.Implementations
{
    public class BorrowingRepository : IBorrowingRepository
    {
        private readonly IMongoCollection<Borrowing> _borrowingsCollection;
        private readonly IMongoCollection<BorrowingItem> _itemsCollection;

        public BorrowingRepository(IMongoDatabase database)
        {
            _borrowingsCollection = database.GetCollection<Borrowing>("borrowings");
            _itemsCollection = database.GetCollection<BorrowingItem>("borrowing_items");
        }

        public async Task<Borrowing?> GetByIdAsync(string id)
        {
            var filter = Builders<Borrowing>.Filter.Eq(b => b.Id, id);
            return await _borrowingsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Borrowing?> GetByCodeAsync(string code)
        {
            var filter = Builders<Borrowing>.Filter.Eq(b => b.Code, code);
            return await _borrowingsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<BorrowingItem>> GetItemsByBorrowingIdAsync(string borrowingId)
        {
            var filter = Builders<BorrowingItem>.Filter.Eq(i => i.BorrowingId, borrowingId);
            return await _itemsCollection.Find(filter).ToListAsync();
        }

        public async Task<BorrowingItem?> GetItemByIdAsync(string itemId)
        {
            var filter = Builders<BorrowingItem>.Filter.Eq(i => i.Id, itemId);
            return await _itemsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<BorrowingItem>> GetActiveItemsByUserIdAsync(string userId)
        {
            var userBorrowings = await _borrowingsCollection
                .Find(b => b.UserId == userId && (b.Status == "OPEN" || b.Status == "PARTIALLY_RETURNED" || b.Status == "OVERDUE"))
                .ToListAsync();

            if (!userBorrowings.Any()) return new List<BorrowingItem>();

            var borrowingIds = userBorrowings.Select(b => b.Id).ToList();
            var filter = Builders<BorrowingItem>.Filter.And(
                Builders<BorrowingItem>.Filter.In(i => i.BorrowingId, borrowingIds),
                Builders<BorrowingItem>.Filter.In(i => i.Status, new[] { "BORROWED", "OVERDUE" })
            );

            return await _itemsCollection.Find(filter).ToListAsync();
        }

        public async Task<long> CountActiveItemsByUserIdAsync(string userId)
        {
            var activeItems = await GetActiveItemsByUserIdAsync(userId);
            return activeItems.Count;
        }

        public async Task<(List<Borrowing> Items, long Total)> SearchAsync(string? userId, string? branchId, string? status, string? keyword, int page, int limit)
        {
            var builder = Builders<Borrowing>.Filter;
            var filters = new List<FilterDefinition<Borrowing>>();

            if (!string.IsNullOrWhiteSpace(userId))
            {
                var trimmedUser = userId.Trim();
                var usersCollection = _borrowingsCollection.Database.GetCollection<User>("users");
                var userRegex = new BsonRegularExpression(Regex.Escape(trimmedUser), "i");

                var matchingUserIds = await usersCollection.Find(
                    u => u.Id == trimmedUser ||
                         u.StudentCode == trimmedUser
                ).Project(u => u.Id).ToListAsync();

                if (!matchingUserIds.Any())
                {
                    matchingUserIds = await usersCollection.Find(
                        Builders<User>.Filter.Regex(u => u.FullName, userRegex) |
                        Builders<User>.Filter.Regex(u => u.StudentCode, userRegex)
                    ).Project(u => u.Id).ToListAsync();
                }

                if (matchingUserIds.Any())
                {
                    filters.Add(builder.In(b => b.UserId, matchingUserIds) | builder.Regex(b => b.UserId, userRegex));
                }
                else
                {
                    filters.Add(builder.Regex(b => b.UserId, userRegex));
                }
            }

            if (!string.IsNullOrWhiteSpace(branchId))
            {
                filters.Add(builder.Eq(b => b.BranchId, branchId.Trim()));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                filters.Add(builder.Eq(b => b.Status, status.Trim()));
            }

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var trimmedKw = Regex.Escape(keyword.Trim());
                var kwRegex = new BsonRegularExpression(trimmedKw, "i");

                var usersCollection = _borrowingsCollection.Database.GetCollection<User>("users");
                var matchingUserIds = await usersCollection.Find(
                    Builders<User>.Filter.Regex(u => u.FullName, kwRegex) |
                    Builders<User>.Filter.Regex(u => u.StudentCode, kwRegex) |
                    Builders<User>.Filter.Regex(u => u.Email, kwRegex)
                ).Project(u => u.Id).ToListAsync();

                var kwFilter = builder.Regex(b => b.Code, kwRegex) | builder.Regex(b => b.UserId, kwRegex);
                if (matchingUserIds.Any())
                {
                    kwFilter |= builder.In(b => b.UserId, matchingUserIds);
                }
                filters.Add(kwFilter);
            }

            var filter = filters.Any() ? builder.And(filters) : builder.Empty;

            var total = await _borrowingsCollection.CountDocumentsAsync(filter);
            var skip = Math.Max(0, (page - 1) * limit);
            var items = await _borrowingsCollection.Find(filter)
                .Skip(skip)
                .Limit(limit)
                .Sort(Builders<Borrowing>.Sort.Descending(b => b.BorrowedAt))
                .ToListAsync();

            return (items, total);
        }

        public async Task InsertAsync(Borrowing borrowing, List<BorrowingItem> items)
        {
            await _borrowingsCollection.InsertOneAsync(borrowing);
            if (items.Any())
            {
                foreach (var item in items)
                {
                    item.BorrowingId = borrowing.Id;
                }
                await _itemsCollection.InsertManyAsync(items);
            }
        }

        public async Task UpdateBorrowingAsync(string id, Borrowing borrowing)
        {
            var filter = Builders<Borrowing>.Filter.Eq(b => b.Id, id);
            await _borrowingsCollection.ReplaceOneAsync(filter, borrowing);
        }

        public async Task UpdateBorrowingItemAsync(string itemId, BorrowingItem item)
        {
            var filter = Builders<BorrowingItem>.Filter.Eq(i => i.Id, itemId);
            await _itemsCollection.ReplaceOneAsync(filter, item);
        }

        public async Task BulkUpdateBorrowingItemsAsync(List<BorrowingItem> items)
        {
            var writes = items.Select(item => new ReplaceOneModel<BorrowingItem>(
                Builders<BorrowingItem>.Filter.Eq(i => i.Id, item.Id),
                item
            )).ToList();

            if (writes.Any())
            {
                await _itemsCollection.BulkWriteAsync(writes);
            }
        }

        public async Task<List<BorrowingItem>> GetOverdueItemsAsync()
        {
            var filter = Builders<BorrowingItem>.Filter.And(
                Builders<BorrowingItem>.Filter.Eq(i => i.Status, "BORROWED"),
                Builders<BorrowingItem>.Filter.Lt(i => i.DueAt, DateTime.UtcNow)
            );
            return await _itemsCollection.Find(filter).ToListAsync();
        }
    }
}
