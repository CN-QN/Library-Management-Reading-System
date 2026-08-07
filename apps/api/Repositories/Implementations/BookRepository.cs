using api.Common.Validation;
using api.Database.Entities;
using api.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

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
            BookDocumentSizeGuard.Validate(book);
            var filter = Builders<Book>.Filter.Eq(b => b.Id, id);
            await _collection.ReplaceOneAsync(filter, book);
        }

        public async Task<bool> SetStatusAsync(string id, string status)
        {
            var filter = Builders<Book>.Filter.Eq(book => book.Id, id);
            var update = Builders<Book>.Update
                .Set(book => book.Status, status)
                .Set(book => book.UpdatedAt, DateTime.UtcNow);
            var result = await _collection.UpdateOneAsync(filter, update);
            return result.MatchedCount > 0;
        }

        public async Task DeleteAsync(string id)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, id);
            await _collection.DeleteOneAsync(filter);
        }

        public async Task<(List<Book> Items, long Total)> SearchAsync(
            string? keyword,
            string? categoryId,
            string? authorId,
            string? status,
            string? availability,
            string? accessType,
            string? language,
            int page,
            int limit,
            string sortBy = "createdAt",
            string sortOrder = "desc")
        {
            var filterBuilder = Builders<Book>.Filter;
            var filters = new List<FilterDefinition<Book>>();

            if (!string.IsNullOrEmpty(keyword))
            {
                var keywordFilter = filterBuilder.Regex(b => b.Title, new BsonRegularExpression(keyword, "i")) |
                                    filterBuilder.Regex(b => b.Summary, new BsonRegularExpression(keyword, "i"));
                filters.Add(keywordFilter);
            }

            if (!string.IsNullOrEmpty(categoryId))
            {
                var normalizedCat = categoryId.Trim();
                var slugifiedCat = normalizedCat.ToLowerInvariant().Replace(' ', '-');
                var catFilter = Builders<BookCategorySnapshot>.Filter.Eq(c => c.CategoryId, categoryId) |
                                Builders<BookCategorySnapshot>.Filter.Eq(c => c.Slug, categoryId) |
                                Builders<BookCategorySnapshot>.Filter.Regex(c => c.Slug, new BsonRegularExpression($"^{Regex.Escape(normalizedCat)}$", "i")) |
                                Builders<BookCategorySnapshot>.Filter.Regex(c => c.Slug, new BsonRegularExpression($"^{Regex.Escape(slugifiedCat)}$", "i")) |
                                Builders<BookCategorySnapshot>.Filter.Regex(c => c.Name, new BsonRegularExpression($"^{Regex.Escape(normalizedCat)}$", "i"));
                filters.Add(filterBuilder.ElemMatch(b => b.Categories, catFilter));
            }

            if (!string.IsNullOrEmpty(authorId))
            {
                filters.Add(filterBuilder.ElemMatch(b => b.Authors,
                    Builders<BookAuthorSnapshot>.Filter.Eq(a => a.AuthorId, authorId)));
            }

            if (!string.IsNullOrEmpty(status))
            {
                filters.Add(filterBuilder.Eq(b => b.Status, status));
            }

            if (!string.IsNullOrEmpty(accessType))
            {
                filters.Add(filterBuilder.Eq(b => b.AccessType, accessType));
            }

            if (!string.IsNullOrEmpty(language))
            {
                var langs = language.Split(',').Select(l => l.Trim()).ToList();
                if (langs.Count == 1)
                {
                    filters.Add(filterBuilder.Eq(b => b.Language, langs[0]));
                }
                else if (langs.Count > 1)
                {
                    filters.Add(filterBuilder.In(b => b.Language, langs));
                }
            }

            if (!string.IsNullOrEmpty(availability))
            {
                var copiesCollection = _collection.Database.GetCollection<BookCopy>("book_copies");
                var availableBookIds = await copiesCollection
                    .Distinct<string>("bookId", Builders<BookCopy>.Filter.Eq(c => c.Status, "AVAILABLE"))
                    .ToListAsync();

                if (availability.ToUpper() == "AVAILABLE")
                {
                    filters.Add(filterBuilder.In(b => b.Id, availableBookIds));
                }
                else if (availability.ToUpper() == "UNAVAILABLE")
                {
                    filters.Add(!filterBuilder.In(b => b.Id, availableBookIds));
                }
            }

            var filter = filters.Any() ? filterBuilder.And(filters) : filterBuilder.Empty;
            var total = await _collection.CountDocumentsAsync(filter);

            var isAsc = sortOrder.ToLower() == "asc";
            SortDefinition<Book> sort = sortBy.ToLower() switch
            {
                "title"     => isAsc ? Builders<Book>.Sort.Ascending(b => b.Title)     : Builders<Book>.Sort.Descending(b => b.Title),
                "viewcount" => isAsc ? Builders<Book>.Sort.Ascending(b => b.Stats!.ViewCount) : Builders<Book>.Sort.Descending(b => b.Stats!.ViewCount),
                "rating"    => isAsc ? Builders<Book>.Sort.Ascending(b => b.Stats!.Rating)    : Builders<Book>.Sort.Descending(b => b.Stats!.Rating),
                _           => isAsc ? Builders<Book>.Sort.Ascending(b => b.CreatedAt) : Builders<Book>.Sort.Descending(b => b.CreatedAt),
            };

            var skip = (page - 1) * limit;
            var items = await _collection.Find(filter)
                .Sort(sort)
                .Skip(skip)
                .Limit(limit)
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

        public async Task<bool> ExistsByISBNAsync(string isbn, string? excludeId = null)
        {
            if (string.IsNullOrWhiteSpace(isbn)) return false;
            var builder = Builders<Book>.Filter;
            var filter = builder.Eq(b => b.ISBN, isbn.Trim());
            if (!string.IsNullOrEmpty(excludeId))
            {
                filter = builder.And(filter, builder.Ne(b => b.Id, excludeId));
            }
            return await _collection.Find(filter).AnyAsync();
        }

        public async Task<bool> ExistsByTitleAsync(string title, string? excludeId = null)
        {
            if (string.IsNullOrWhiteSpace(title)) return false;
            var normalizedTitle = title.Trim();
            var builder = Builders<Book>.Filter;
            var filter = builder.Regex(b => b.Title, new BsonRegularExpression($"^{Regex.Escape(normalizedTitle)}$", "i"));
            if (!string.IsNullOrEmpty(excludeId))
            {
                filter = builder.And(filter, builder.Ne(b => b.Id, excludeId));
            }
            return await _collection.Find(filter).AnyAsync();
        }

        // ── Embedded chapter operations ──────────────────────────────────────

        public async Task<BookChapter?> GetChapterByIdAsync(string bookId, string chapterId)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, bookId);
            var book = await _collection.Find(filter).FirstOrDefaultAsync();
            return book?.Chapters.FirstOrDefault(c => c.ChapterId == chapterId);
        }

        public async Task<List<BookChapter>> GetChaptersByBookIdAsync(string bookId)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, bookId);
            var book = await _collection.Find(filter).FirstOrDefaultAsync();
            return book?.Chapters ?? new List<BookChapter>();
        }

        public async Task<BookChapter?> GetChapterByNumberAsync(string bookId, int number)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, bookId);
            var book = await _collection.Find(filter).FirstOrDefaultAsync();
            return book?.Chapters.FirstOrDefault(c => c.Number == number);
        }

        public async Task<bool> AddChapterAsync(string bookId, BookChapter chapter)
        {
            chapter.CreatedAt = DateTime.UtcNow;
            chapter.UpdatedAt = DateTime.UtcNow;

            var filter = Builders<Book>.Filter.Eq(b => b.Id, bookId);
            var update = Builders<Book>.Update
                .Push(b => b.Chapters, chapter)
                .Inc(b => b.TotalChapters, 1)
                .Set(b => b.UpdatedAt, DateTime.UtcNow);

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ReplaceChapterAsync(string bookId, string chapterId, BookChapter chapter)
        {
            var existingBook = await GetByIdAsync(bookId);
            if (existingBook is null) return false;

            chapter.UpdatedAt = DateTime.UtcNow;

            var idx = existingBook.Chapters.FindIndex(c => c.ChapterId == chapterId);
            if (idx < 0) return false;

            existingBook.Chapters[idx] = chapter;
            existingBook.UpdatedAt = DateTime.UtcNow;

            BookDocumentSizeGuard.Validate(existingBook);

            var filter = Builders<Book>.Filter.Eq(b => b.Id, bookId) &
                         Builders<Book>.Filter.ElemMatch(b => b.Chapters,
                             Builders<BookChapter>.Filter.Eq(c => c.ChapterId, chapterId));

            var update = Builders<Book>.Update
                .Set("chapters.$", chapter)
                .Set(b => b.UpdatedAt, DateTime.UtcNow);

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ReplaceChaptersAsync(string bookId, IReadOnlyList<BookChapter> chapters)
        {
            var existingBook = await GetByIdAsync(bookId);
            if (existingBook is null) return false;

            existingBook.Chapters = chapters.ToList();
            existingBook.TotalChapters = chapters.Count;
            existingBook.UpdatedAt = DateTime.UtcNow;

            BookDocumentSizeGuard.Validate(existingBook);

            var filter = Builders<Book>.Filter.Eq(b => b.Id, bookId);
            var update = Builders<Book>.Update
                .Set(b => b.Chapters, existingBook.Chapters)
                .Set(b => b.TotalChapters, existingBook.TotalChapters)
                .Set(b => b.UpdatedAt, DateTime.UtcNow);

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ArchiveChapterAsync(string bookId, string chapterId)
        {
            var filter = Builders<Book>.Filter.Eq(b => b.Id, bookId);
            var update = Builders<Book>.Update
                .PullFilter(b => b.Chapters, c => c.ChapterId == chapterId)
                .Inc(b => b.TotalChapters, -1)
                .Set(b => b.UpdatedAt, DateTime.UtcNow);

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
    }
}
