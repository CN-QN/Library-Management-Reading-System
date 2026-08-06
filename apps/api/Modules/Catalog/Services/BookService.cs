using api.Database.Entities;
using api.Modules.Catalog.DTOs;
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
        private readonly ILogger<BookService> _logger;

        public BookService(
            IBookRepository bookRepository,
            ILogger<BookService> logger)
        {
            _bookRepository = bookRepository;
            _logger = logger;
        }

        public async Task<BookResponseDto?> GetByIdAsync(string id)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            return book == null ? null : MapToResponse(book);
        }

        public async Task<BookResponseDto?> GetBySlugAsync(string slug)
        {
            var book = await _bookRepository.GetBySlugAsync(slug);
            return book == null ? null : MapToResponse(book);
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

            var items = books.Select(MapToResponse).ToList();

            return new PagedResult<BookResponseDto>(items, query.Page, query.Limit, total);
        }

        public async Task<List<BookResponseDto>> GetTrendingAsync(int limit)
        {
            var books = await _bookRepository.GetTrendingAsync(limit);
            return books.Select(MapToResponse).ToList();
        }

        public async Task<List<BookResponseDto>> GetNewReleasesAsync(int limit)
        {
            var books = await _bookRepository.GetNewReleasesAsync(limit);
            return books.Select(MapToResponse).ToList();
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
                PublicationYear = dto.PublicationYear,
                Language = dto.Language ?? "vi",
                AccessType = dto.AccessType ?? "FREE",
                Status = "DRAFT",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Stats = new BookStats()
            };

            // Map embedded author snapshots if supplied
            if (dto.Authors != null)
            {
                book.Authors = dto.Authors.Select((a, i) => new BookAuthorSnapshot
                {
                    AuthorId = a.AuthorId,
                    Name = a.Name,
                    Slug = a.Slug,
                    Role = a.Role ?? "AUTHOR",
                    Order = a.Order > 0 ? a.Order : i + 1
                }).ToList();
            }

            // Map embedded category snapshots if supplied
            if (dto.Categories != null)
            {
                book.Categories = dto.Categories.Select(c => new BookCategorySnapshot
                {
                    CategoryId = c.CategoryId,
                    Name = c.Name,
                    Slug = c.Slug
                }).ToList();
            }

            // Map embedded publisher snapshot if supplied
            if (dto.Publisher != null)
            {
                book.Publisher = new BookPublisherSnapshot
                {
                    PublisherId = dto.Publisher.PublisherId,
                    Name = dto.Publisher.Name,
                    Slug = dto.Publisher.Slug
                };
            }

            await _bookRepository.InsertAsync(book);
            _logger.LogInformation("Book created: {Title} by user {UserId}", book.Title, userId);

            return MapToResponse(book);
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

            // Update embedded author snapshots if supplied
            if (dto.Authors != null)
            {
                book.Authors = dto.Authors.Select((a, i) => new BookAuthorSnapshot
                {
                    AuthorId = a.AuthorId,
                    Name = a.Name,
                    Slug = a.Slug,
                    Role = a.Role ?? "AUTHOR",
                    Order = a.Order > 0 ? a.Order : i + 1
                }).ToList();
            }

            // Update embedded category snapshots if supplied
            if (dto.Categories != null)
            {
                book.Categories = dto.Categories.Select(c => new BookCategorySnapshot
                {
                    CategoryId = c.CategoryId,
                    Name = c.Name,
                    Slug = c.Slug
                }).ToList();
            }

            // Update embedded publisher snapshot if supplied
            if (dto.Publisher != null)
            {
                book.Publisher = new BookPublisherSnapshot
                {
                    PublisherId = dto.Publisher.PublisherId,
                    Name = dto.Publisher.Name,
                    Slug = dto.Publisher.Slug
                };
            }

            book.UpdatedAt = DateTime.UtcNow;
            await _bookRepository.UpdateAsync(id, book);
            _logger.LogInformation("Book updated: {Title} by user {UserId}", book.Title, userId);

            return MapToResponse(book);
        }

        public async Task<BookResponseDto?> UpdateStatusAsync(string id, string status, string userId)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return null;

            book.Status = status;
            book.UpdatedAt = DateTime.UtcNow;
            await _bookRepository.UpdateAsync(id, book);
            _logger.LogInformation("Book status updated: {Title} -> {Status} by user {UserId}", book.Title, status, userId);

            return MapToResponse(book);
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return false;

            book.Status = "ARCHIVED";
            book.UpdatedAt = DateTime.UtcNow;
            await _bookRepository.UpdateAsync(id, book);
            _logger.LogInformation("Book archived: {Title}", book.Title);

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

        private static BookResponseDto MapToResponse(Book book)
        {
            return new BookResponseDto
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
                Authors = (book.Authors ?? new List<BookAuthorSnapshot>()).Select(a => new BookAuthorDto
                {
                    AuthorId = a.AuthorId,
                    Name = a.Name,
                    Slug = a.Slug,
                    Role = a.Role,
                    Order = a.Order
                }).ToList(),
                Categories = (book.Categories ?? new List<BookCategorySnapshot>()).Select(c => new BookCategoryDto
                {
                    CategoryId = c.CategoryId,
                    Name = c.Name,
                    Slug = c.Slug
                }).ToList(),
                Publisher = book.Publisher == null ? null : new BookPublisherDto
                {
                    PublisherId = book.Publisher.PublisherId,
                    Name = book.Publisher.Name,
                    Slug = book.Publisher.Slug
                },
                Chapters = book.Chapters ?? new List<BookChapter>()
            };
        }
    }
}
