using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Modules.SearchAndRecommendation.DTOs;
using api.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace api.Repositories.Implementations
{
    public class SearchRecommendationRepository : ISearchRecommendationRepository
    {
        private readonly IMongoCollection<Book> _booksCollection;
        private readonly IMongoCollection<Author> _authorsCollection;
        private readonly IMongoCollection<Category> _categoriesCollection;
        private readonly IMongoCollection<BookAuthor> _bookAuthorsCollection;
        private readonly IMongoCollection<BookCategory> _bookCategoriesCollection;
        private readonly IMongoCollection<ReadingProgress> _readingProgressCollection;
        private readonly IMongoCollection<ReadingSession> _readingSessionCollection;
        private readonly IMongoCollection<ViewEvent> _viewEventsCollection;
        private readonly IMongoCollection<Borrowing> _borrowingsCollection;
        private readonly IMongoCollection<BorrowingItem> _borrowingItemsCollection;
        private readonly IMongoCollection<BookCopy> _bookCopiesCollection;

        public SearchRecommendationRepository(MongoDbContext dbContext)
        {
            _booksCollection = dbContext.Books;
            _authorsCollection = dbContext.Database.GetCollection<Author>("authors");
            _categoriesCollection = dbContext.Database.GetCollection<Category>("categories");
            _bookAuthorsCollection = dbContext.Database.GetCollection<BookAuthor>("book_authors");
            _bookCategoriesCollection = dbContext.Database.GetCollection<BookCategory>("book_categories");
            _readingProgressCollection = dbContext.ReadingProgresses;
            _readingSessionCollection = dbContext.ReadingSessions;
            _viewEventsCollection = dbContext.ViewEvents;
            _borrowingsCollection = dbContext.Borrowings;
            _borrowingItemsCollection = dbContext.BorrowingItems;
            _bookCopiesCollection = dbContext.BookCopies;
        }

        public async Task<PagedResult<BookSearchDto>> SearchBooksAsync(BookSearchFilterDto filter)
        {
            var bookIdsFilter = new List<string>();

            // Lọc theo CategoryId
            if (!string.IsNullOrEmpty(filter.CategoryId))
            {
                var categoryMatches = await _bookCategoriesCollection
                    .Find(bc => bc.CategoryId == filter.CategoryId)
                    .Project(bc => bc.BookId)
                    .ToListAsync();
                
                bookIdsFilter.AddRange(categoryMatches);
                if (!bookIdsFilter.Any())
                {
                    return new PagedResult<BookSearchDto>(Enumerable.Empty<BookSearchDto>(), filter.Page, filter.Limit, 0);
                }
            }

            // Lọc theo AuthorId
            if (!string.IsNullOrEmpty(filter.AuthorId))
            {
                var authorMatches = await _bookAuthorsCollection
                    .Find(ba => ba.AuthorId == filter.AuthorId)
                    .Project(ba => ba.BookId)
                    .ToListAsync();

                if (bookIdsFilter.Any())
                {
                    bookIdsFilter = bookIdsFilter.Intersect(authorMatches).ToList();
                }
                else
                {
                    bookIdsFilter.AddRange(authorMatches);
                }

                if (!bookIdsFilter.Any())
                {
                    return new PagedResult<BookSearchDto>(Enumerable.Empty<BookSearchDto>(), filter.Page, filter.Limit, 0);
                }
            }

            var pipeline = new List<BsonDocument>();

            // Match basic book filters
            var matchDoc = new BsonDocument("status", "PUBLISHED");
            if (!string.IsNullOrEmpty(filter.Language))
            {
                matchDoc.Add("language", filter.Language);
            }
            if (!string.IsNullOrEmpty(filter.AccessType))
            {
                matchDoc.Add("accessType", filter.AccessType);
            }
            if (filter.MinYear.HasValue || filter.MaxYear.HasValue)
            {
                var yearFilter = new BsonDocument();
                if (filter.MinYear.HasValue) yearFilter.Add("$gte", filter.MinYear.Value);
                if (filter.MaxYear.HasValue) yearFilter.Add("$lte", filter.MaxYear.Value);
                matchDoc.Add("publicationYear", yearFilter);
            }

            if (bookIdsFilter.Any())
            {
                matchDoc.Add("_id", new BsonDocument("$in", new BsonArray(bookIdsFilter.Select(id => ObjectId.Parse(id)))));
            }

            pipeline.Add(new BsonDocument("$match", matchDoc));

            // Lookup authors
            pipeline.Add(BsonDocument.Parse(@"{
                $lookup: {
                    from: 'book_authors',
                    localField: '_id',
                    foreignField: 'bookId',
                    as: 'book_authors'
                }
            }"));

            pipeline.Add(BsonDocument.Parse(@"{
                $lookup: {
                    from: 'authors',
                    localField: 'book_authors.authorId',
                    foreignField: '_id',
                    as: 'authors'
                }
            }"));

            // Lookup categories
            pipeline.Add(BsonDocument.Parse(@"{
                $lookup: {
                    from: 'book_categories',
                    localField: '_id',
                    foreignField: 'bookId',
                    as: 'book_categories'
                }
            }"));

            pipeline.Add(BsonDocument.Parse(@"{
                $lookup: {
                    from: 'categories',
                    localField: 'book_categories.categoryId',
                    foreignField: '_id',
                    as: 'categories'
                }
            }"));

            // Keyword match (Search in title, summary, author name, category name)
            if (!string.IsNullOrEmpty(filter.Keyword))
            {
                var regexPattern = new BsonRegularExpression(filter.Keyword, "i");
                var orFilters = new BsonArray
                {
                    new BsonDocument("title", new BsonDocument("$regex", regexPattern)),
                    new BsonDocument("summary", new BsonDocument("$regex", regexPattern)),
                    new BsonDocument("authors.name", new BsonDocument("$regex", regexPattern)),
                    new BsonDocument("categories.name", new BsonDocument("$regex", regexPattern))
                };
                pipeline.Add(new BsonDocument("$match", new BsonDocument("$or", orFilters)));
            }

            // Sorting
            var sortDoc = new BsonDocument();
            switch (filter.SortBy.ToLower())
            {
                case "title_asc": sortDoc.Add("title", 1); break;
                case "title_desc": sortDoc.Add("title", -1); break;
                case "year_asc": sortDoc.Add("publicationYear", 1); break;
                case "year_desc": sortDoc.Add("publicationYear", -1); break;
                case "views_desc": sortDoc.Add("stats.viewCount", -1); break;
                case "rating_desc": sortDoc.Add("stats.rating", -1); break;
                default: sortDoc.Add("stats.viewCount", -1); break;
            }
            pipeline.Add(new BsonDocument("$sort", sortDoc));

            // Paginated Facet
            var facetStage = BsonDocument.Parse($@"{{
                $facet: {{
                    metadata: [ {{ $count: 'total' }} ],
                    data: [ {{ $skip: {(filter.Page - 1) * filter.Limit} }}, {{ $limit: {filter.Limit} }} ]
                }}
            }}");
            pipeline.Add(facetStage);

            var aggregationResult = await _booksCollection.Aggregate<BsonDocument>(pipeline).FirstOrDefaultAsync();
            long totalItems = 0;
            var itemsList = new List<BookSearchDto>();

            if (aggregationResult != null)
            {
                var metadata = aggregationResult["metadata"].AsBsonArray;
                if (metadata.Any())
                {
                    totalItems = metadata[0]["total"].AsInt32;
                }

                var data = aggregationResult["data"].AsBsonArray;
                foreach (var doc in data)
                {
                    var bookDoc = doc.AsBsonDocument;
                    var searchDto = new BookSearchDto
                    {
                        BookId = bookDoc["_id"].ToString(),
                        Title = bookDoc.Contains("title") ? bookDoc["title"].AsString : "",
                        Slug = bookDoc.Contains("slug") ? bookDoc["slug"].AsString : "",
                        ISBN = bookDoc.Contains("isbn") && !bookDoc["isbn"].BsonType.Equals(BsonType.Null) ? bookDoc["isbn"].AsString : null,
                        Summary = bookDoc.Contains("summary") && !bookDoc["summary"].BsonType.Equals(BsonType.Null) ? bookDoc["summary"].AsString : null,
                        PublisherId = bookDoc.Contains("publisherId") && !bookDoc["publisherId"].BsonType.Equals(BsonType.Null) ? bookDoc["publisherId"].ToString() : null,
                        CoverAssetId = bookDoc.Contains("coverAssetId") && !bookDoc["coverAssetId"].BsonType.Equals(BsonType.Null) ? bookDoc["coverAssetId"].ToString() : null,
                        AccessType = bookDoc.Contains("accessType") ? bookDoc["accessType"].AsString : "FREE",
                        Status = bookDoc.Contains("status") ? bookDoc["status"].AsString : "PUBLISHED",
                        PublicationYear = bookDoc.Contains("publicationYear") && !bookDoc["publicationYear"].BsonType.Equals(BsonType.Null) ? bookDoc["publicationYear"].AsInt32 : null,
                        Language = bookDoc.Contains("language") ? bookDoc["language"].AsString : "vi",
                        TotalChapters = bookDoc.Contains("totalChapters") ? bookDoc["totalChapters"].AsInt32 : 0
                    };

                    if (bookDoc.Contains("stats") && !bookDoc["stats"].BsonType.Equals(BsonType.Null))
                    {
                        var statsDoc = bookDoc["stats"].AsBsonDocument;
                        searchDto.ViewCount = statsDoc.Contains("viewCount") ? statsDoc["viewCount"].AsInt32 : 0;
                        searchDto.ReadingCount = statsDoc.Contains("readingCount") ? statsDoc["readingCount"].AsInt32 : 0;
                        searchDto.Rating = statsDoc.Contains("rating") ? statsDoc["rating"].AsDouble : 0.0;
                        searchDto.RatingCount = statsDoc.Contains("ratingCount") ? statsDoc["ratingCount"].AsInt32 : 0;
                    }

                    if (bookDoc.Contains("authors"))
                    {
                        foreach (var authVal in bookDoc["authors"].AsBsonArray)
                        {
                            var authDoc = authVal.AsBsonDocument;
                            searchDto.Authors.Add(new AuthorSearchDto
                            {
                                Id = authDoc["_id"].ToString(),
                                Name = authDoc.Contains("name") ? authDoc["name"].AsString : ""
                            });
                        }
                    }

                    if (bookDoc.Contains("categories"))
                    {
                        foreach (var catVal in bookDoc["categories"].AsBsonArray)
                        {
                            var catDoc = catVal.AsBsonDocument;
                            searchDto.Categories.Add(new CategorySearchDto
                            {
                                Id = catDoc["_id"].ToString(),
                                Name = catDoc.Contains("name") ? catDoc["name"].AsString : ""
                            });
                        }
                    }

                    itemsList.Add(searchDto);
                }
            }

            return new PagedResult<BookSearchDto>(itemsList, filter.Page, filter.Limit, totalItems);
        }

        public async Task<List<SearchSuggestionDto>> GetSearchSuggestionsAsync(string query)
        {
            var suggestions = new List<SearchSuggestionDto>();
            if (string.IsNullOrEmpty(query)) return suggestions;

            var regex = new BsonRegularExpression(query, "i");

            // Lọc bằng C# regex để tránh lỗi Regex filter builder
            var books = await _booksCollection.Find(b => b.Status == "PUBLISHED").ToListAsync();
            var bookMatches = books
                .Where(b => b.Title.Contains(query, StringComparison.OrdinalIgnoreCase))
                .Take(5);

            foreach (var book in bookMatches)
            {
                suggestions.Add(new SearchSuggestionDto
                {
                    Type = "BOOK",
                    Id = book.Id,
                    Text = book.Title,
                    Subtext = "Sách số"
                });
            }

            // 2. Tìm tác giả trùng khớp
            var authors = await _authorsCollection.Find(_ => true).ToListAsync();
            var authorMatches = authors
                .Where(a => a.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
                .Take(5);

            foreach (var author in authorMatches)
            {
                suggestions.Add(new SearchSuggestionDto
                {
                    Type = "AUTHOR",
                    Id = author.Id,
                    Text = author.Name,
                    Subtext = "Tác giả"
                });
            }

            return suggestions;
        }

        public async Task<List<Book>> GetBooksByIdsAsync(List<string> bookIds)
        {
            if (bookIds == null || !bookIds.Any()) return new List<Book>();
            return await _booksCollection.Find(b => bookIds.Contains(b.Id) && b.Status == "PUBLISHED").ToListAsync();
        }

        public async Task<List<string>> GetUserReadBookIdsAsync(string userId)
        {
            var readProgressBookIds = await _readingProgressCollection
                .Find(rp => rp.UserId == userId)
                .Project(rp => rp.BookId)
                .ToListAsync();

            var sessionBookIds = await _readingSessionCollection
                .Find(s => s.UserId == userId)
                .Project(s => s.BookId)
                .ToListAsync();

            var borrowBookIds = new List<string>();
            var userBorrowings = await _borrowingsCollection
                .Find(b => b.UserId == userId)
                .Project(b => b.Id)
                .ToListAsync();

            if (userBorrowings.Any())
            {
                var borrowItems = await _borrowingItemsCollection
                    .Find(bi => userBorrowings.Contains(bi.BorrowingId))
                    .Project(bi => bi.CopyId)
                    .ToListAsync();

                if (borrowItems.Any())
                {
                    borrowBookIds = await _bookCopiesCollection
                        .Find(c => borrowItems.Contains(c.Id))
                        .Project(c => c.BookId)
                        .ToListAsync();
                }
            }

            return readProgressBookIds
                .Concat(sessionBookIds)
                .Concat(borrowBookIds)
                .Distinct()
                .ToList();
        }

        public async Task<List<string>> GetBookAuthorIdsAsync(List<string> bookIds)
        {
            if (bookIds == null || !bookIds.Any()) return new List<string>();
            var authorIds = await _bookAuthorsCollection
                .Find(ba => bookIds.Contains(ba.BookId))
                .Project(ba => ba.AuthorId)
                .ToListAsync();
            return authorIds.Distinct().ToList();
        }

        public async Task<List<string>> GetBookCategoryIdsAsync(List<string> bookIds)
        {
            if (bookIds == null || !bookIds.Any()) return new List<string>();
            var categoryIds = await _bookCategoriesCollection
                .Find(bc => bookIds.Contains(bc.BookId))
                .Project(bc => bc.CategoryId)
                .ToListAsync();
            return categoryIds.Distinct().ToList();
        }

        public async Task<List<Book>> GetSimilarBooksAsync(List<string> authorIds, List<string> categoryIds, List<string> excludeBookIds, int limit)
        {
            var matchedBookIds = new List<string>();

            if (authorIds != null && authorIds.Any())
            {
                var authorBooks = await _bookAuthorsCollection
                    .Find(ba => authorIds.Contains(ba.AuthorId))
                    .Project(ba => ba.BookId)
                    .ToListAsync();
                matchedBookIds.AddRange(authorBooks);
            }

            if (categoryIds != null && categoryIds.Any())
            {
                var categoryBooks = await _bookCategoriesCollection
                    .Find(bc => categoryIds.Contains(bc.CategoryId))
                    .Project(bc => bc.BookId)
                    .ToListAsync();
                matchedBookIds.AddRange(categoryBooks);
            }

            matchedBookIds = matchedBookIds.Distinct().ToList();

            if (excludeBookIds != null && excludeBookIds.Any())
            {
                matchedBookIds = matchedBookIds.Except(excludeBookIds).ToList();
            }

            if (!matchedBookIds.Any())
            {
                return new List<Book>();
            }

            return await _booksCollection
                .Find(b => matchedBookIds.Contains(b.Id) && b.Status == "PUBLISHED")
                .SortByDescending(b => b.Stats.Rating)
                .ThenByDescending(b => b.Stats.ViewCount)
                .Limit(limit)
                .ToListAsync();
        }

        public async Task<List<Book>> GetGeneralRecommendationsAsync(int limit)
        {
            return await _booksCollection
                .Find(b => b.Status == "PUBLISHED")
                .SortByDescending(b => b.Stats.Rating)
                .ThenByDescending(b => b.Stats.ViewCount)
                .Limit(limit)
                .ToListAsync();
        }

        public async Task<List<ViewEvent>> GetViewEventsSinceAsync(DateTime since)
        {
            return await _viewEventsCollection
                .Find(ve => ve.CreatedAt >= since)
                .ToListAsync();
        }

        public async Task<List<Borrowing>> GetBorrowingsSinceAsync(DateTime since)
        {
            return await _borrowingsCollection
                .Find(b => b.BorrowedAt >= since)
                .ToListAsync();
        }

        public async Task<List<BorrowingItem>> GetBorrowingItemsByBorrowingIdsAsync(List<string> borrowingIds)
        {
            if (borrowingIds == null || !borrowingIds.Any()) return new List<BorrowingItem>();
            return await _borrowingItemsCollection
                .Find(bi => borrowingIds.Contains(bi.BorrowingId))
                .ToListAsync();
        }

        public async Task<List<BookCopy>> GetCopiesByIdsAsync(List<string> copyIds)
        {
            if (copyIds == null || !copyIds.Any()) return new List<BookCopy>();
            return await _bookCopiesCollection
                .Find(c => copyIds.Contains(c.Id))
                .ToListAsync();
        }

        public async Task<List<BookSearchDto>> GetBookDetailsByIdsAsync(List<string> bookIds)
        {
            if (bookIds == null || !bookIds.Any()) return new List<BookSearchDto>();

            var pipeline = new List<BsonDocument>();

            var matchDoc = new BsonDocument();
            matchDoc.Add("_id", new BsonDocument("$in", new BsonArray(bookIds.Select(id => ObjectId.Parse(id)))));
            pipeline.Add(new BsonDocument("$match", matchDoc));

            // Lookup authors
            pipeline.Add(BsonDocument.Parse(@"{
                $lookup: {
                    from: 'book_authors',
                    localField: '_id',
                    foreignField: 'bookId',
                    as: 'book_authors'
                }
            }"));

            pipeline.Add(BsonDocument.Parse(@"{
                $lookup: {
                    from: 'authors',
                    localField: 'book_authors.authorId',
                    foreignField: '_id',
                    as: 'authors'
                }
            }"));

            // Lookup categories
            pipeline.Add(BsonDocument.Parse(@"{
                $lookup: {
                    from: 'book_categories',
                    localField: '_id',
                    foreignField: 'bookId',
                    as: 'book_categories'
                }
            }"));

            pipeline.Add(BsonDocument.Parse(@"{
                $lookup: {
                    from: 'categories',
                    localField: 'book_categories.categoryId',
                    foreignField: '_id',
                    as: 'categories'
                }
            }"));

            var aggregationResult = await _booksCollection.Aggregate<BsonDocument>(pipeline).ToListAsync();
            var itemsList = new List<BookSearchDto>();

            foreach (var bookDoc in aggregationResult)
            {
                var searchDto = new BookSearchDto
                {
                    BookId = bookDoc["_id"].ToString(),
                    Title = bookDoc.Contains("title") ? bookDoc["title"].AsString : "",
                    Slug = bookDoc.Contains("slug") ? bookDoc["slug"].AsString : "",
                    ISBN = bookDoc.Contains("isbn") && !bookDoc["isbn"].BsonType.Equals(BsonType.Null) ? bookDoc["isbn"].AsString : null,
                    Summary = bookDoc.Contains("summary") && !bookDoc["summary"].BsonType.Equals(BsonType.Null) ? bookDoc["summary"].AsString : null,
                    PublisherId = bookDoc.Contains("publisherId") && !bookDoc["publisherId"].BsonType.Equals(BsonType.Null) ? bookDoc["publisherId"].ToString() : null,
                    CoverAssetId = bookDoc.Contains("coverAssetId") && !bookDoc["coverAssetId"].BsonType.Equals(BsonType.Null) ? bookDoc["coverAssetId"].ToString() : null,
                    AccessType = bookDoc.Contains("accessType") ? bookDoc["accessType"].AsString : "FREE",
                    Status = bookDoc.Contains("status") ? bookDoc["status"].AsString : "PUBLISHED",
                    PublicationYear = bookDoc.Contains("publicationYear") && !bookDoc["publicationYear"].BsonType.Equals(BsonType.Null) ? bookDoc["publicationYear"].AsInt32 : null,
                    Language = bookDoc.Contains("language") ? bookDoc["language"].AsString : "vi",
                    TotalChapters = bookDoc.Contains("totalChapters") ? bookDoc["totalChapters"].AsInt32 : 0
                };

                if (bookDoc.Contains("stats") && !bookDoc["stats"].BsonType.Equals(BsonType.Null))
                {
                    var statsDoc = bookDoc["stats"].AsBsonDocument;
                    searchDto.ViewCount = statsDoc.Contains("viewCount") ? statsDoc["viewCount"].AsInt32 : 0;
                    searchDto.ReadingCount = statsDoc.Contains("readingCount") ? statsDoc["readingCount"].AsInt32 : 0;
                    searchDto.Rating = statsDoc.Contains("rating") ? statsDoc["rating"].AsDouble : 0.0;
                    searchDto.RatingCount = statsDoc.Contains("ratingCount") ? statsDoc["ratingCount"].AsInt32 : 0;
                }

                if (bookDoc.Contains("authors"))
                {
                    foreach (var authVal in bookDoc["authors"].AsBsonArray)
                    {
                        var authDoc = authVal.AsBsonDocument;
                        searchDto.Authors.Add(new AuthorSearchDto
                        {
                            Id = authDoc["_id"].ToString(),
                            Name = authDoc.Contains("name") ? authDoc["name"].AsString : ""
                        });
                    }
                }

                if (bookDoc.Contains("categories"))
                {
                    foreach (var catVal in bookDoc["categories"].AsBsonArray)
                    {
                        var catDoc = catVal.AsBsonDocument;
                        searchDto.Categories.Add(new CategorySearchDto
                        {
                            Id = catDoc["_id"].ToString(),
                            Name = catDoc.Contains("name") ? catDoc["name"].AsString : ""
                        });
                    }
                }

                itemsList.Add(searchDto);
            }

            return itemsList.OrderBy(x => bookIds.IndexOf(x.BookId)).ToList();
        }
    }
}
