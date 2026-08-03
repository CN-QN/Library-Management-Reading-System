using api.Database.Entities;
using api.Modules.Catalog.DTOs.Requests;
using api.Modules.Catalog.DTOs.Responses;
using api.Repositories.Interfaces;
using api.Common.Models;
using Microsoft.Extensions.Logging;

namespace api.Modules.Catalog.Services
{
    public class BookService : IBookService
    {
        private readonly IBookRepository _bookRepository;
        private readonly IAuthorRepository _authorRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IPublisherRepository _publisherRepository;
        private readonly ILogger<BookService> _logger;

        public BookService(
            IBookRepository bookRepository,
            IAuthorRepository authorRepository,
            ICategoryRepository categoryRepository,
            IPublisherRepository publisherRepository,
            ILogger<BookService> logger)
        {
            _bookRepository = bookRepository;
            _authorRepository = authorRepository;
            _categoryRepository = categoryRepository;
            _publisherRepository = publisherRepository;
            _logger = logger;
        }

        public async Task<BookResponseDto?> GetByIdAsync(string id)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            return book == null ? null : await MapToResponseAsync(book);
        }

        public async Task<BookResponseDto?> GetBySlugAsync(string slug)
        {
            var book = await _bookRepository.GetBySlugAsync(slug);
            return book == null ? null : await MapToResponseAsync(book);
        }

        public async Task<PagedResult<BookResponseDto>> SearchAsync(BookQueryDto query)
        {
            var (books, total) = await _bookRepository.SearchAsync(
                query.Keyword,
                query.CategoryId,
                query.AuthorId,
                query.Status,
                query.Availability,
                query.AccessType,
                query.Page,
                query.Limit,
                query.SortBy,
                query.SortOrder
            );

            var items = new List<BookResponseDto>();
            foreach (var book in books)
            {
                items.Add(await MapToResponseAsync(book));
            }

            return new PagedResult<BookResponseDto>(items, query.Page, query.Limit, total);
        }

        public async Task<List<BookResponseDto>> GetTrendingAsync(int limit)
        {
            var books = await _bookRepository.GetTrendingAsync(limit);
            var result = new List<BookResponseDto>();
            foreach (var book in books)
            {
                result.Add(await MapToResponseAsync(book));
            }
            return result;
        }

        public async Task<List<BookResponseDto>> GetNewReleasesAsync(int limit)
        {
            var books = await _bookRepository.GetNewReleasesAsync(limit);
            var result = new List<BookResponseDto>();
            foreach (var book in books)
            {
                result.Add(await MapToResponseAsync(book));
            }
            return result;
        }

        public async Task<BookResponseDto> CreateAsync(CreateBookDto dto, string userId)
        {
            if (await _bookRepository.ExistsBySlugAsync(dto.Slug))
                throw new InvalidOperationException($"Slug '{dto.Slug}' already exists");

            if (!string.IsNullOrEmpty(dto.ISBN) && await _bookRepository.ExistsByISBNAsync(dto.ISBN))
                throw new InvalidOperationException($"ISBN '{dto.ISBN}' already exists");

            var book = new Book
            {
                Title = dto.Title,
                Slug = dto.Slug,
                ISBN = dto.ISBN,
                Summary = dto.Summary,
                PublisherId = dto.PublisherId,
                PublicationYear = dto.PublicationYear,
                Language = dto.Language ?? "vi",
                AccessType = dto.AccessType ?? "FREE",
                Status = "DRAFT",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Stats = new BookStats(),
                // [THÊM MỚI] Lưu danh sách CategoryIds và AuthorIds
                CategoryIds = dto.CategoryIds ?? new List<string>(),
                AuthorIds = dto.AuthorIds ?? new List<string>()
            };

            await _bookRepository.InsertAsync(book);
            _logger.LogInformation($"Book created: {book.Title} by user {userId}");

            return await MapToResponseAsync(book);
        }

        public async Task<BookResponseDto?> UpdateAsync(string id, UpdateBookDto dto, string userId)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return null;

            if (!string.IsNullOrEmpty(dto.Title)) book.Title = dto.Title;
            if (!string.IsNullOrEmpty(dto.Summary)) book.Summary = dto.Summary;
            if (dto.PublicationYear.HasValue) book.PublicationYear = dto.PublicationYear;
            if (!string.IsNullOrEmpty(dto.Language)) book.Language = dto.Language;
            if (!string.IsNullOrEmpty(dto.AccessType)) book.AccessType = dto.AccessType;
            
            // [THÊM MỚI] Cập nhật danh sách CategoryIds và AuthorIds
            if (dto.CategoryIds != null) book.CategoryIds = dto.CategoryIds;
            if (dto.AuthorIds != null) book.AuthorIds = dto.AuthorIds;

            book.UpdatedAt = DateTime.UtcNow;
            await _bookRepository.UpdateAsync(id, book);
            _logger.LogInformation($"Book updated: {book.Title} by user {userId}");

            return await MapToResponseAsync(book);
        }

        public async Task<BookResponseDto?> UpdateStatusAsync(string id, string status, string userId)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return null;

            book.Status = status;
            book.UpdatedAt = DateTime.UtcNow;
            await _bookRepository.UpdateAsync(id, book);
            _logger.LogInformation($"Book status updated: {book.Title} -> {status} by user {userId}");

            return await MapToResponseAsync(book);
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return false;

            book.Status = "ARCHIVED";
            book.UpdatedAt = DateTime.UtcNow;
            await _bookRepository.UpdateAsync(id, book);
            _logger.LogInformation($"Book archived: {book.Title}");

            return true;
        }

        public async Task IncrementViewAsync(string id)
        {
            await _bookRepository.IncrementViewCountAsync(id);
        }

        public async Task<bool> ValidateSlugAsync(string slug)
        {
            return !await _bookRepository.ExistsBySlugAsync(slug);
        }

        public async Task<bool> ValidateISBNAsync(string isbn)
        {
            if (string.IsNullOrEmpty(isbn)) return true;
            return !await _bookRepository.ExistsByISBNAsync(isbn);
        }

        // [SỬA LỖI QUAN TRỌNG] Cập nhật MapToResponseAsync để lấy tên Authors và Categories
        private async Task<BookResponseDto> MapToResponseAsync(Book book)
        {
            var response = new BookResponseDto
            {
                Id = book.Id,
                Title = book.Title,
                Slug = book.Slug,
                ISBN = book.ISBN,
                Summary = book.Summary,
                PublicationYear = book.PublicationYear,
                Language = book.Language,
                AccessType = book.AccessType,
                Status = book.Status,
                TotalChapters = book.TotalChapters,
                CoverAssetId = book.CoverAssetId,
                ViewCount = book.Stats?.ViewCount ?? 0,
                Rating = book.Stats?.Rating ?? 0,
                CreatedAt = book.CreatedAt,
                UpdatedAt = book.UpdatedAt,
                // [THÊM MỚI] Gán danh sách ID
                CategoryIds = book.CategoryIds ?? new List<string>(),
                AuthorIds = book.AuthorIds ?? new List<string>()
            };

            // Lấy tên Publisher
            if (!string.IsNullOrEmpty(book.PublisherId))
            {
                var publisher = await _publisherRepository.GetByIdAsync(book.PublisherId);
                response.PublisherName = publisher?.Name;
            }

            // [SỬA LỖI] Lấy danh sách tên Categories
            var categoryNames = new List<string>();
            if (book.CategoryIds != null && book.CategoryIds.Any())
            {
                var categories = await _categoryRepository.GetByIdsAsync(book.CategoryIds);
                if (categories != null)
                {
                    categoryNames = categories.Select(c => c.Name).ToList();
                }
            }
            response.CategoryNames = categoryNames;

            // [SỬA LỖI] Lấy danh sách tên Authors
            var authorNames = new List<string>();
            if (book.AuthorIds != null && book.AuthorIds.Any())
            {
                var authors = await _authorRepository.GetByIdsAsync(book.AuthorIds);
                if (authors != null)
                {
                    authorNames = authors.Select(a => a.Name).ToList();
                }
            }
            response.AuthorNames = authorNames;

            return response;
        }
    }
}