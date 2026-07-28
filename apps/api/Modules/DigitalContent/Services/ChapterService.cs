using api.Database.Entities;
using api.Modules.DigitalContent.DTOs;
using api.Repositories.Interfaces;
using Microsoft.Extensions.Logging;

namespace api.Modules.DigitalContent.Services
{
    public class ChapterService : IChapterService
    {
        private readonly IChapterRepository _chapterRepository;
        private readonly IBookRepository _bookRepository;
        private readonly ILogger<ChapterService> _logger;

        public ChapterService(
            IChapterRepository chapterRepository,
            IBookRepository bookRepository,
            ILogger<ChapterService> logger)
        {
            _chapterRepository = chapterRepository;
            _bookRepository = bookRepository;
            _logger = logger;
        }

        public async Task<ChapterResponseDto?> GetByIdAsync(string id)
        {
            var chapter = await _chapterRepository.GetByIdAsync(id);
            return chapter == null ? null : MapToResponse(chapter);
        }

        public async Task<List<ChapterResponseDto>> GetByBookIdAsync(string bookId)
        {
            var chapters = await _chapterRepository.GetByBookIdAsync(bookId);
            return chapters.Select(MapToResponse).ToList();
        }

        public async Task<ChapterContentDto?> GetContentAsync(string id)
        {
            var chapter = await _chapterRepository.GetByIdAsync(id);
            if (chapter == null) return null;

            return new ChapterContentDto
            {
                Id = chapter.Id,
                BookId = chapter.BookId,
                Number = chapter.Number,
                Title = chapter.Title,
                ContentJson = chapter.ContentJson ?? string.Empty,
                UpdatedAt = chapter.UpdatedAt
            };
        }

        public async Task<ChapterResponseDto> CreateAsync(CreateChapterDto dto, string userId)
        {
            var book = await _bookRepository.GetByIdAsync(dto.BookId);
            if (book == null)
                throw new InvalidOperationException("Book not found");

            if (await _chapterRepository.ExistsByNumberAsync(dto.BookId, dto.Number))
                throw new InvalidOperationException($"Chapter {dto.Number} already exists in this book");

            var chapter = new Chapter
            {
                BookId = dto.BookId,
                Number = dto.Number,
                Title = dto.Title,
                ContentJson = dto.ContentJson ?? "{}",
                WordCount = dto.WordCount ?? 0,
                Status = "DRAFT",
                Version = 1,
                CreatedBy = userId,
                UpdatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _chapterRepository.InsertAsync(chapter);
            _logger.LogInformation($"Chapter {dto.Number} created for book {dto.BookId} by user {userId}");

            return MapToResponse(chapter);
        }

        public async Task<ChapterResponseDto?> UpdateAsync(string id, UpdateChapterDto dto, string userId)
        {
            var chapter = await _chapterRepository.GetByIdAsync(id);
            if (chapter == null) return null;

            if (!string.IsNullOrEmpty(dto.Title)) chapter.Title = dto.Title;
            if (!string.IsNullOrEmpty(dto.ContentJson))
            {
                chapter.ContentJson = dto.ContentJson;
                chapter.Version++;
            }
            if (dto.WordCount.HasValue) chapter.WordCount = dto.WordCount.Value;

            chapter.UpdatedBy = userId;
            chapter.UpdatedAt = DateTime.UtcNow;

            await _chapterRepository.UpdateAsync(id, chapter);
            _logger.LogInformation($"Chapter {chapter.Number} updated for book {chapter.BookId} by user {userId}");

            return MapToResponse(chapter);
        }

        public async Task<ChapterResponseDto?> PublishAsync(string id, string userId)
        {
            var chapter = await _chapterRepository.GetByIdAsync(id);
            if (chapter == null) return null;

            chapter.Status = "PUBLISHED";
            chapter.PublishedAt = DateTime.UtcNow;
            chapter.UpdatedBy = userId;
            chapter.UpdatedAt = DateTime.UtcNow;

            await _chapterRepository.UpdateAsync(id, chapter);

            var publishedChapters = await _chapterRepository.GetPublishedChaptersAsync(chapter.BookId);
            await _bookRepository.UpdateTotalChaptersAsync(chapter.BookId, publishedChapters.Count);

            _logger.LogInformation($"Chapter {chapter.Number} published for book {chapter.BookId} by user {userId}");

            return MapToResponse(chapter);
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var chapter = await _chapterRepository.GetByIdAsync(id);
            if (chapter == null) return false;

            chapter.Status = "HIDDEN";
            chapter.UpdatedAt = DateTime.UtcNow;
            await _chapterRepository.UpdateAsync(id, chapter);

            var publishedChapters = await _chapterRepository.GetPublishedChaptersAsync(chapter.BookId);
            await _bookRepository.UpdateTotalChaptersAsync(chapter.BookId, publishedChapters.Count);

            _logger.LogInformation($"Chapter {chapter.Number} hidden for book {chapter.BookId}");
            return true;
        }

        public async Task<int> GetNextChapterNumberAsync(string bookId)
        {
            var chapters = await _chapterRepository.GetByBookIdAsync(bookId);
            return chapters.Any() ? chapters.Max(c => c.Number) + 1 : 1;
        }

        private ChapterResponseDto MapToResponse(Chapter chapter)
        {
            return new ChapterResponseDto
            {
                Id = chapter.Id,
                BookId = chapter.BookId,
                Number = chapter.Number,
                Title = chapter.Title,
                ContentJson = chapter.ContentJson,
                WordCount = chapter.WordCount,
                Status = chapter.Status,
                Version = chapter.Version,
                PublishedAt = chapter.PublishedAt,
                CreatedAt = chapter.CreatedAt,
                UpdatedAt = chapter.UpdatedAt
            };
        }
    }
}