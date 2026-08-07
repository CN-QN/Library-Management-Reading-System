using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Modules.SearchAndRecommendation.DTOs;
using api.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace api.Repositories.Implementations
{
    public class SearchRecommendationRepository : ISearchRecommendationRepository
    {
        private readonly IMongoCollection<Book> _booksCollection;
        private readonly IMongoCollection<ReadingProgress> _readingProgressCollection;
        private readonly IMongoCollection<ReadingSession> _readingSessionCollection;
        private readonly IMongoCollection<ViewEvent> _viewEventsCollection;
        private readonly IMongoCollection<Borrowing> _borrowingsCollection;
        private readonly IMongoCollection<BorrowingItem> _borrowingItemsCollection;
        private readonly IMongoCollection<BookCopy> _bookCopiesCollection;

        public SearchRecommendationRepository(MongoDbContext dbContext)
        {
            _booksCollection = dbContext.Books;
            _readingProgressCollection = dbContext.ReadingProgresses;
            _readingSessionCollection = dbContext.ReadingSessions;
            _viewEventsCollection = dbContext.ViewEvents;
            _borrowingsCollection = dbContext.Borrowings;
            _borrowingItemsCollection = dbContext.BorrowingItems;
            _bookCopiesCollection = dbContext.BookCopies;
        }

        public async Task<PagedResult<BookSearchDto>> SearchBooksAsync(BookSearchFilterDto filter)
        {
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

            if (!string.IsNullOrEmpty(filter.CategoryId))
            {
                var normCat = filter.CategoryId.Trim();
                var slugCat = normCat.ToLowerInvariant().Replace(' ', '-');
                var catOr = new BsonArray
                {
                    new BsonDocument("categories.categoryId", filter.CategoryId),
                    new BsonDocument("categories.slug", filter.CategoryId),
                    new BsonDocument("categories.slug", new BsonRegularExpression($"^{Regex.Escape(normCat)}$", "i")),
                    new BsonDocument("categories.slug", new BsonRegularExpression($"^{Regex.Escape(slugCat)}$", "i")),
                    new BsonDocument("categories.name", new BsonRegularExpression($"^{Regex.Escape(normCat)}$", "i"))
                };
                matchDoc.Add("$or", catOr);
            }

            if (!string.IsNullOrEmpty(filter.AuthorId))
            {
                matchDoc.Add("authors.authorId", filter.AuthorId);
            }

            // Keyword match
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
                matchDoc.Add("$or", orFilters);
            }

            pipeline.Add(new BsonDocument("$match", matchDoc));

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
                        PublisherId = bookDoc.Contains("publisher") && !bookDoc["publisher"].BsonType.Equals(BsonType.Null) && bookDoc["publisher"].AsBsonDocument.Contains("publisherId") ? bookDoc["publisher"]["publisherId"].AsString : null,
                        CoverAssetId = bookDoc.Contains("coverAssetId") && !bookDoc["coverAssetId"].BsonType.Equals(BsonType.Null) ? bookDoc["coverAssetId"].ToString() : null,
                        CoverImageUrl = bookDoc.Contains("coverImageUrl") && !bookDoc["coverImageUrl"].BsonType.Equals(BsonType.Null)
                            ? bookDoc["coverImageUrl"].AsString
                            : bookDoc.Contains("coverAssetId") && bookDoc["coverAssetId"].IsString && Uri.TryCreate(bookDoc["coverAssetId"].AsString, UriKind.Absolute, out _)
                                ? bookDoc["coverAssetId"].AsString
                                : null,
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

                    if (bookDoc.Contains("authors") && bookDoc["authors"].IsBsonArray)
                    {
                        foreach (var authVal in bookDoc["authors"].AsBsonArray)
                        {
                            var authDoc = authVal.AsBsonDocument;
                            searchDto.Authors.Add(new AuthorSearchDto
                            {
                                Id = authDoc.Contains("authorId") ? authDoc["authorId"].AsString : "",
                                Name = authDoc.Contains("name") ? authDoc["name"].AsString : ""
                            });
                        }
                    }

                    if (bookDoc.Contains("categories") && bookDoc["categories"].IsBsonArray)
                    {
                        foreach (var catVal in bookDoc["categories"].AsBsonArray)
                        {
                            var catDoc = catVal.AsBsonDocument;
                            searchDto.Categories.Add(new CategorySearchDto
                            {
                                Id = catDoc.Contains("categoryId") ? catDoc["categoryId"].AsString : "",
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

            var authors = books.SelectMany(b => b.Authors).DistinctBy(a => a.AuthorId).ToList();
            var authorMatches = authors
                .Where(a => a.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
                .Take(5);

            foreach (var author in authorMatches)
            {
                suggestions.Add(new SearchSuggestionDto
                {
                    Type = "AUTHOR",
                    Id = author.AuthorId,
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
            var books = await _booksCollection.Find(b => bookIds.Contains(b.Id)).ToListAsync();
            return books.SelectMany(b => b.Authors).Select(a => a.AuthorId).Distinct().ToList();
        }

        public async Task<List<string>> GetBookCategoryIdsAsync(List<string> bookIds)
        {
            if (bookIds == null || !bookIds.Any()) return new List<string>();
            var books = await _booksCollection.Find(b => bookIds.Contains(b.Id)).ToListAsync();
            return books.SelectMany(b => b.Categories).Select(c => c.CategoryId).Distinct().ToList();
        }

        public async Task<List<Book>> GetSimilarBooksAsync(List<string> authorIds, List<string> categoryIds, List<string> excludeBookIds, int limit)
        {
            var filterBuilder = Builders<Book>.Filter;
            var statusFilter = filterBuilder.Eq(b => b.Status, "PUBLISHED");
            
            var orFilters = new List<FilterDefinition<Book>>();
            if (authorIds != null && authorIds.Any())
            {
                orFilters.Add(filterBuilder.ElemMatch(b => b.Authors, a => authorIds.Contains(a.AuthorId)));
            }
            if (categoryIds != null && categoryIds.Any())
            {
                orFilters.Add(filterBuilder.ElemMatch(b => b.Categories, c => categoryIds.Contains(c.CategoryId)));
            }
            
            if (!orFilters.Any()) return new List<Book>();

            var matchFilter = filterBuilder.And(statusFilter, filterBuilder.Or(orFilters));

            if (excludeBookIds != null && excludeBookIds.Any())
            {
                matchFilter = filterBuilder.And(matchFilter, filterBuilder.Nin(b => b.Id, excludeBookIds));
            }

            return await _booksCollection
                .Find(matchFilter)
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

            var books = await _booksCollection.Find(b => bookIds.Contains(b.Id)).ToListAsync();
            var itemsList = new List<BookSearchDto>();

            foreach (var book in books)
            {
                var searchDto = new BookSearchDto
                {
                    BookId = book.Id,
                    Title = book.Title,
                    Slug = book.Slug,
                    ISBN = book.ISBN,
                    Summary = book.Summary,
                    PublisherId = book.Publisher?.PublisherId,
                    CoverAssetId = book.CoverAssetId,
                    CoverImageUrl = book.CoverImageUrl ??
                        (Uri.TryCreate(book.CoverAssetId, UriKind.Absolute, out _) ? book.CoverAssetId : null),
                    AccessType = book.AccessType,
                    Status = book.Status,
                    PublicationYear = book.PublicationYear,
                    Language = book.Language,
                    TotalChapters = book.TotalChapters,
                    ViewCount = book.Stats.ViewCount,
                    ReadingCount = book.Stats.ReadingCount,
                    Rating = book.Stats.Rating,
                    RatingCount = book.Stats.RatingCount
                };

                if (book.Authors != null)
                {
                    searchDto.Authors = book.Authors.Select(a => new AuthorSearchDto { Id = a.AuthorId, Name = a.Name }).ToList();
                }

                if (book.Categories != null)
                {
                    searchDto.Categories = book.Categories.Select(c => new CategorySearchDto { Id = c.CategoryId, Name = c.Name }).ToList();
                }

                itemsList.Add(searchDto);
            }

            return itemsList.OrderBy(x => bookIds.IndexOf(x.BookId)).ToList();
        }
    }
}
