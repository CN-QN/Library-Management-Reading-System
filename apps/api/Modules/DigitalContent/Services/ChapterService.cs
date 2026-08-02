using api.Database.Entities;
using api.Modules.DigitalContent.DTOs;
using api.Modules.DigitalContent.Services;
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
            return chapter == null ? null : MapToResponseDto(chapter);
        }

        public async Task<List<ChapterResponseDto>> GetByBookIdAsync(string bookId)
        {
            var chapters = await _chapterRepository.GetByBookIdAsync(bookId);
            return chapters.Select(MapToResponseDto).ToList();
        }

        // [SỬA] Đơn giản hóa GetContentAsync
        public async Task<ChapterContentDto?> GetContentAsync(string id)
        {
            var chapter = await _chapterRepository.GetByIdAsync(id);
            if (chapter == null || chapter.Content == null)
                return null;

            return new ChapterContentDto
            {
                Introduction = chapter.Content.Introduction,
                Conclusion = chapter.Content.Conclusion,
                Paragraphs = chapter.Content.Paragraphs.Select(p => new ParagraphDto
                {
                    Id = p.Id,
                    Text = p.Text,
                    Order = p.Order
                }).ToList()
            };
        }

        public async Task<int> GetNextChapterNumberAsync(string bookId)
        {
            var chapters = await _chapterRepository.GetByBookIdAsync(bookId);
            return chapters.Any() ? chapters.Max(c => c.Number) + 1 : 1;
        }

        public async Task<ChapterResponseDto> CreateAsync(CreateChapterDto dto, string userId)
        {
            // Kiểm tra trùng số chương
            var existingChapter = await _chapterRepository.GetByBookIdAndNumberAsync(dto.BookId, dto.Number);
            if (existingChapter != null)
                throw new InvalidOperationException($"Chapter number {dto.Number} already exists in this book.");

            // Tính word count từ content
            var wordCount = CalculateWordCount(dto.Content);
            var readingTime = CalculateReadingTime(wordCount);

            var chapter = new Chapter
            {
                BookId = dto.BookId,
                Title = dto.Title,
                Number = dto.Number,
                Summary = dto.Summary,
                Content = dto.Content,
                Status = "DRAFT",
                WordCount = wordCount,
                ReadingTime = readingTime,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _chapterRepository.InsertAsync(chapter);
            
            // Cập nhật tổng số chương của sách
            var totalChapters = await _chapterRepository.CountByBookIdAsync(dto.BookId);
            await _bookRepository.UpdateTotalChaptersAsync(dto.BookId, totalChapters);

            _logger.LogInformation($"Chapter created: {chapter.Title} (Book: {dto.BookId}) by user {userId}");

            return MapToResponseDto(chapter);
        }

        public async Task<ChapterResponseDto?> UpdateAsync(string id, UpdateChapterDto dto, string userId)
        {
            var chapter = await _chapterRepository.GetByIdAsync(id);
            if (chapter == null) return null;

            // Kiểm tra trùng số chương nếu thay đổi number
            if (dto.Number.HasValue && dto.Number.Value != chapter.Number)
            {
                var existingChapter = await _chapterRepository.GetByBookIdAndNumberAsync(
                    chapter.BookId, 
                    dto.Number.Value
                );
                if (existingChapter != null && existingChapter.Id != id)
                    throw new InvalidOperationException($"Chapter number {dto.Number.Value} already exists in this book.");
                
                chapter.Number = dto.Number.Value;
            }

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
            await _chapterRepository.UpdateAsync(id, chapter);

            _logger.LogInformation($"Chapter updated: {chapter.Title} by user {userId}");

            return MapToResponseDto(chapter);
        }

        public async Task<ChapterResponseDto?> PublishAsync(string id, string userId)
        {
            var chapter = await _chapterRepository.GetByIdAsync(id);
            if (chapter == null) return null;

            if (chapter.Content == null || !chapter.Content.Paragraphs.Any())
                throw new InvalidOperationException("Cannot publish chapter with empty content.");

            chapter.Status = "PUBLISHED";
            chapter.PublishedAt = DateTime.UtcNow;
            chapter.UpdatedAt = DateTime.UtcNow;
            
            await _chapterRepository.UpdateAsync(id, chapter);

            _logger.LogInformation($"Chapter published: {chapter.Title} by user {userId}");

            return MapToResponseDto(chapter);
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var chapter = await _chapterRepository.GetByIdAsync(id);
            if (chapter == null) return false;

            chapter.Status = "ARCHIVED";
            chapter.UpdatedAt = DateTime.UtcNow;
            
            await _chapterRepository.UpdateAsync(id, chapter);

            // Cập nhật lại tổng số chương của sách
            var totalChapters = await _chapterRepository.CountByBookIdAsync(chapter.BookId);
            await _bookRepository.UpdateTotalChaptersAsync(chapter.BookId, totalChapters);

            _logger.LogInformation($"Chapter archived: {chapter.Title}");

            return true;
        }

        public async Task<bool> ReorderChaptersAsync(string bookId, List<string> orderedChapterIds)
        {
            var chapters = await _chapterRepository.GetByBookIdAsync(bookId);
            
            if (orderedChapterIds.Count != chapters.Count || 
                orderedChapterIds.Except(chapters.Select(c => c.Id)).Any())
            {
                throw new ArgumentException("Invalid chapter list. Some chapters are missing or extra.");
            }

            for (int i = 0; i < orderedChapterIds.Count; i++)
            {
                await _chapterRepository.UpdateOrderAsync(orderedChapterIds[i], i + 1);
            }

            _logger.LogInformation($"Chapters reordered for book {bookId}");

            return true;
        }

        // ============== Helper Methods ==============

        private int CalculateWordCount(ChapterContent? content)
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

        private int CalculateReadingTime(int wordCount)
        {
            // Trung bình 200 từ/phút
            return Math.Max(1, (int)Math.Ceiling(wordCount / 200.0));
        }

        private ChapterResponseDto MapToResponseDto(Chapter chapter)
        {
            return new ChapterResponseDto
            {
                Id = chapter.Id,
                BookId = chapter.BookId,
                Title = chapter.Title,
                Number = chapter.Number,
                Summary = chapter.Summary,
                Content = chapter.Content,
                Status = chapter.Status,
                WordCount = chapter.WordCount,
                ReadingTime = chapter.ReadingTime,
                CreatedAt = chapter.CreatedAt,
                UpdatedAt = chapter.UpdatedAt,
                PublishedAt = chapter.PublishedAt
            };
        }
    }
}