using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Driver;
using MongoDB.Bson; 

namespace api.Repositories.Implementations
{
    public class BookRepository : IBookRepository
    {
        private readonly IMongoCollection<Book> _collection;

        public BookRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<Book>("books");
        }

        public async Task<Book?> GetByIdAsync(string id)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Book?> GetBySlugAsync(string slug)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Slug, slug);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Book?> GetByISBNAsync(string isbn)
        {
            if (string.IsNullOrEmpty(isbn)) return null;
            var filter = Builders<Book>.Filter.Eq(b => b.ISBN, isbn);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<Book>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task InsertAsync(Book book)
        {
            await _collection.InsertOneAsync(book);
        }

        public async Task UpdateAsync(string id, Book book)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, id);
            await _collection.ReplaceOneAsync(filter, book);
        }

        public async Task DeleteAsync(string id)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, id);
            await _collection.DeleteOneAsync(filter);
        }

        // [SỬA LỖI] Cập nhật SearchAsync để lọc theo CategoryId và AuthorId
        public async Task<(List<Book> Items, long Total)> SearchAsync(
            string? keyword, 
            string? categoryId, 
            string? authorId, 
            string? status, 
            int page, 
            int limit)
        {
            var filterBuilder = Builders<Book>.Filter;
            var filters = new List<FilterDefinition<Book>>();

            // [SỬA LỖI 1] Lọc theo keyword - Sử dụng Regex thay vì Text Search
            if (!string.IsNullOrEmpty(keyword))
            {
                var keywordFilter = filterBuilder.Regex(b => b.Title, new BsonRegularExpression(keyword, "i")) |
                                    filterBuilder.Regex(b => b.Summary, new BsonRegularExpression(keyword, "i"));
                filters.Add(keywordFilter);
            }

            // [SỬA LỖI 2] Lọc theo CategoryId - THÊM MỚI
            if (!string.IsNullOrEmpty(categoryId))
            {
                filters.Add(filterBuilder.AnyEq(b => b.CategoryIds, categoryId));
            }

            // [SỬA LỖI 3] Lọc theo AuthorId - THÊM MỚI
            if (!string.IsNullOrEmpty(authorId))
            {
                filters.Add(filterBuilder.AnyEq(b => b.AuthorIds, authorId));
            }

            // Lọc theo status
            if (!string.IsNullOrEmpty(status))
            {
                filters.Add(filterBuilder.Eq(b => b.Status, status));
            }

            // Kết hợp tất cả filters
            var filter = filters.Any() ? filterBuilder.And(filters) : filterBuilder.Empty;
            
            // Đếm tổng số bản ghi
            var total = await _collection.CountDocumentsAsync(filter);

            // Phân trang và sắp xếp
            var skip = (page - 1) * limit;
            var items = await _collection.Find(filter)
                .Skip(skip)
                .Limit(limit)
                .Sort(Builders<Book>.Sort.Descending(b => b.CreatedAt))
                .ToListAsync();

            return (items, total);
        }

        public async Task<List<Book>> GetTrendingAsync(int limit)
        {
            return await _collection.Find(b => b.Status == "PUBLISHED")
                .Sort(Builders<Book>.Sort.Descending(b => b.Stats!.ViewCount))
                .Limit(limit)
                .ToListAsync();
        }

        public async Task<List<Book>> GetNewReleasesAsync(int limit)
        {
            return await _collection.Find(b => b.Status == "PUBLISHED")
                .Sort(Builders<Book>.Sort.Descending(b => b.CreatedAt))
                .Limit(limit)
                .ToListAsync();
        }

        public async Task<long> CountByStatusAsync(string status)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Status, status);
            return await _collection.CountDocumentsAsync(filter);
        }

        public async Task IncrementViewCountAsync(string bookId)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, bookId);
            var update = Builders<Book>.Update.Inc(b => b.Stats!.ViewCount, 1);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task UpdateTotalChaptersAsync(string bookId, int count)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, bookId);
            var update = Builders<Book>.Update.Set(b => b.TotalChapters, count);
            await _collection.UpdateOneAsync(filter, update);
        }

        public async Task<bool> ExistsBySlugAsync(string slug)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Slug, slug);
            return await _collection.Find(filter).AnyAsync();
        }

        public async Task<bool> ExistsByISBNAsync(string isbn)
        {
            if (string.IsNullOrEmpty(isbn)) return false;
            var filter = Builders<Book>.Filter.Eq(b => b.ISBN, isbn);
            return await _collection.Find(filter).AnyAsync();
        }
    }
}