using api.Common.Validation;
using api.Database.Entities;
using api.Modules.DigitalContent.DTOs;
using api.Repositories.Interfaces;
using Microsoft.Extensions.Logging;

namespace api.Modules.DigitalContent.Services
{
    public class ChapterService : IChapterService
    {
        private readonly IBookRepository _bookRepository;
        private readonly ILogger<ChapterService> _logger;

        public ChapterService(
            IBookRepository bookRepository,
            ILogger<ChapterService> logger)
        {
            _bookRepository = bookRepository;
            _logger = logger;
        }

        public async Task<BookChapter?> GetByIdAsync(string bookId, string chapterId)
        {
            return await _bookRepository.GetChapterByIdAsync(bookId, chapterId);
        }

        public async Task<List<BookChapter>> GetByBookIdAsync(string bookId)
        {
            var chapters = await _bookRepository.GetChaptersByBookIdAsync(bookId);

            // Repair legacy book statuses: a book with at least one public chapter
            // must be visible as published as well.
            if (chapters.Any(chapter => chapter.Status == "PUBLISHED"))
                await _bookRepository.SetStatusAsync(bookId, "PUBLISHED");

            return chapters;
        }

        public async Task<int> GetNextNumberAsync(string bookId)
        {
            var chapters = await _bookRepository.GetChaptersByBookIdAsync(bookId);
            return chapters.Count == 0 ? 1 : chapters.Max(chapter => chapter.Number) + 1;
        }

        public async Task<ChapterContentDto?> GetContentAsync(string bookId, string chapterId)
        {
            var chapter = await _bookRepository.GetChapterByIdAsync(bookId, chapterId);
            if (chapter == null || chapter.Content == null)
                return null;

            var content = chapter.Content;
            return new ChapterContentDto
            {
                Introduction = content.Introduction,
                Paragraphs = content.Paragraphs.Select(p => new ParagraphDto
                {
                    Id = p.Id,
                    Text = p.Text,
                    Order = p.Order
                }).ToList(),
                Conclusion = content.Conclusion
            };
        }

        public async Task<BookChapter> CreateAsync(string bookId, CreateChapterDto dto, string userId)
        {
            var book = await _bookRepository.GetByIdAsync(bookId);
            if (book == null)
                throw new InvalidOperationException($"Book '{bookId}' not found.");

            // Validate chapter number uniqueness
            var existing = await _bookRepository.GetChapterByNumberAsync(bookId, dto.Number);
            if (existing != null)
                throw new InvalidOperationException($"Chapter number {dto.Number} already exists in this book.");

            var wordCount = CalculateWordCount(dto.Content);
            var readingTime = CalculateReadingTime(wordCount);

            var chapter = new BookChapter
            {
                ChapterId = Guid.NewGuid().ToString("N"),
                Number = dto.Number,
                Title = dto.Title,
                Summary = dto.Summary,
                Content = dto.Content ?? new ChapterContent(),
                WordCount = wordCount,
                ReadingTime = readingTime,
                Status = "DRAFT",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            book.Chapters.Add(chapter);
            BookDocumentSizeGuard.Validate(book);

            await _bookRepository.AddChapterAsync(bookId, chapter);

            _logger.LogInformation("Chapter created: {Title} (Book: {BookId}) by user {UserId}", chapter.Title, bookId, userId);

            return chapter;
        }

        public async Task<BookChapter?> UpdateAsync(string bookId, string chapterId, UpdateChapterDto dto, string userId)
        {
            var chapter = await _bookRepository.GetChapterByIdAsync(bookId, chapterId);
            if (chapter == null) return null;

            if (!string.IsNullOrEmpty(dto.Title))
                chapter.Title = dto.Title;

            if (dto.Summary != null)
                chapter.Summary = dto.Summary;

            if (dto.Content != null)
            {
                chapter.Content = dto.Content;
                chapter.WordCount = CalculateWordCount(dto.Content);
                chapter.ReadingTime = CalculateReadingTime(chapter.WordCount);
            }

            chapter.UpdatedAt = DateTime.UtcNow;
            await _bookRepository.ReplaceChapterAsync(bookId, chapterId, chapter);

            _logger.LogInformation("Chapter updated: {Title} by user {UserId}", chapter.Title, userId);

            return chapter;
        }

        public async Task<BookChapter?> PublishAsync(string bookId, string chapterId, string userId)
        {
            var chapter = await _bookRepository.GetChapterByIdAsync(bookId, chapterId);
            if (chapter == null) return null;

            if (chapter.Content == null || !chapter.Content.Paragraphs.Any())
                throw new InvalidOperationException("Cannot publish chapter with empty content.");

            chapter.Status = "PUBLISHED";
            chapter.PublishedAt = DateTime.UtcNow;
            chapter.UpdatedAt = DateTime.UtcNow;

            await _bookRepository.ReplaceChapterAsync(bookId, chapterId, chapter);
            await _bookRepository.SetStatusAsync(bookId, "PUBLISHED");

            _logger.LogInformation("Chapter published: {Title} by user {UserId}", chapter.Title, userId);

            return chapter;
        }

        public async Task<bool> DeleteAsync(string bookId, string chapterId)
        {
            var chapter = await _bookRepository.GetChapterByIdAsync(bookId, chapterId);
            if (chapter == null) return false;

            await _bookRepository.ArchiveChapterAsync(bookId, chapterId);

            _logger.LogInformation("Chapter archived: {ChapterId} from book {BookId}", chapterId, bookId);

            return true;
        }

        public async Task<bool> ReorderChaptersAsync(string bookId, List<string> orderedChapterIds)
        {
            var chapters = await _bookRepository.GetChaptersByBookIdAsync(bookId);

            var existingIds = chapters.Select(c => c.ChapterId).ToHashSet();
            var suppliedIds = orderedChapterIds.ToHashSet();

            if (orderedChapterIds.Count != orderedChapterIds.Distinct().Count())
                throw new ArgumentException("Duplicate chapter IDs in reorder list.");

            if (!suppliedIds.SetEquals(existingIds))
                throw new ArgumentException("Invalid chapter list. Some chapters are missing or extra.");

            var reordered = orderedChapterIds
                .Select((id, index) =>
                {
                    var ch = chapters.First(c => c.ChapterId == id);
                    ch.Number = index + 1;
                    ch.UpdatedAt = DateTime.UtcNow;
                    return ch;
                })
                .ToList();

            await _bookRepository.ReplaceChaptersAsync(bookId, reordered);

            _logger.LogInformation("Chapters reordered for book {BookId}", bookId);

            return true;
        }

        // ============== Helper Methods ==============

        private static int CalculateWordCount(ChapterContent? content)
        {
            if (content == null) return 0;

            var wordCount = 0;

            if (!string.IsNullOrEmpty(content.Introduction))
                wordCount += content.Introduction.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

            foreach (var paragraph in content.Paragraphs)
            {
                wordCount += paragraph.Text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
            }

            if (!string.IsNullOrEmpty(content.Conclusion))
                wordCount += content.Conclusion.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

            return wordCount;
        }

        private static int CalculateReadingTime(int wordCount)
        {
            // Average 200 words/minute
            return Math.Max(1, (int)Math.Ceiling(wordCount / 200.0));
        }
    }
}
