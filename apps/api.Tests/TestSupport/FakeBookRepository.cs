using api.Database.Entities;
using api.Repositories.Interfaces;

namespace api.Tests.TestSupport;

/// <summary>
/// In-memory fake IBookRepository for unit tests that do not need MongoDB.
/// </summary>
public sealed class FakeBookRepository : IBookRepository
{
    private readonly List<Book> _books = new();

    public FakeBookRepository(IEnumerable<Book>? seed = null)
    {
        if (seed != null) _books.AddRange(seed);
    }

    public Task<Book?> GetByIdAsync(string id)
        => Task.FromResult(_books.FirstOrDefault(b => b.Id == id));

    public Task<Book?> GetBySlugAsync(string slug)
        => Task.FromResult(_books.FirstOrDefault(b => b.Slug == slug));

    public Task<Book?> GetByISBNAsync(string isbn)
        => Task.FromResult(_books.FirstOrDefault(b => b.ISBN == isbn));

    public Task<List<Book>> GetAllAsync()
        => Task.FromResult(_books.ToList());

    public Task InsertAsync(Book book)
    {
        _books.Add(book);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(string id, Book book)
    {
        var idx = _books.FindIndex(b => b.Id == id);
        if (idx >= 0) _books[idx] = book;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string id)
    {
        _books.RemoveAll(b => b.Id == id);
        return Task.CompletedTask;
    }

    public Task<(List<Book> Items, long Total)> SearchAsync(
        string? keyword, string? categoryId, string? authorId, string? status,
        string? availability, string? accessType, int page, int limit,
        string sortBy = "createdAt", string sortOrder = "desc")
        => Task.FromResult((new List<Book>(), 0L));

    public Task<List<Book>> GetTrendingAsync(int limit)
        => Task.FromResult(new List<Book>());

    public Task<List<Book>> GetNewReleasesAsync(int limit)
        => Task.FromResult(new List<Book>());

    public Task<long> CountByStatusAsync(string status)
        => Task.FromResult(0L);

    public Task IncrementViewCountAsync(string bookId)
        => Task.CompletedTask;

    public Task UpdateTotalChaptersAsync(string bookId, int count)
    {
        var book = _books.FirstOrDefault(b => b.Id == bookId);
        if (book != null) book.TotalChapters = count;
        return Task.CompletedTask;
    }

    public Task<bool> ExistsBySlugAsync(string slug)
        => Task.FromResult(_books.Any(b => b.Slug == slug));

    public Task<bool> ExistsByISBNAsync(string isbn)
        => Task.FromResult(_books.Any(b => b.ISBN == isbn));

    // ---- Embedded chapter methods ----

    public Task<BookChapter?> GetChapterByIdAsync(string bookId, string chapterId)
    {
        var book = _books.FirstOrDefault(b => b.Id == bookId);
        var chapter = book?.Chapters.FirstOrDefault(c => c.ChapterId == chapterId);
        return Task.FromResult(chapter);
    }

    public Task<List<BookChapter>> GetChaptersByBookIdAsync(string bookId)
    {
        var book = _books.FirstOrDefault(b => b.Id == bookId);
        return Task.FromResult(book?.Chapters.ToList() ?? new List<BookChapter>());
    }

    public Task<BookChapter?> GetChapterByNumberAsync(string bookId, int number)
    {
        var book = _books.FirstOrDefault(b => b.Id == bookId);
        var chapter = book?.Chapters.FirstOrDefault(c => c.Number == number);
        return Task.FromResult(chapter);
    }

    public Task<bool> AddChapterAsync(string bookId, BookChapter chapter)
    {
        var book = _books.FirstOrDefault(b => b.Id == bookId);
        if (book == null) return Task.FromResult(false);
        book.Chapters.Add(chapter);
        book.TotalChapters = book.Chapters.Count;
        return Task.FromResult(true);
    }

    public Task<bool> ReplaceChapterAsync(string bookId, string chapterId, BookChapter chapter)
    {
        var book = _books.FirstOrDefault(b => b.Id == bookId);
        if (book == null) return Task.FromResult(false);
        var idx = book.Chapters.FindIndex(c => c.ChapterId == chapterId);
        if (idx < 0) return Task.FromResult(false);
        book.Chapters[idx] = chapter;
        return Task.FromResult(true);
    }

    public Task<bool> ReplaceChaptersAsync(string bookId, IReadOnlyList<BookChapter> chapters)
    {
        var book = _books.FirstOrDefault(b => b.Id == bookId);
        if (book == null) return Task.FromResult(false);
        book.Chapters = chapters.ToList();
        book.TotalChapters = book.Chapters.Count;
        return Task.FromResult(true);
    }

    public Task<bool> ArchiveChapterAsync(string bookId, string chapterId)
    {
        var book = _books.FirstOrDefault(b => b.Id == bookId);
        if (book == null) return Task.FromResult(false);
        var chapter = book.Chapters.FirstOrDefault(c => c.ChapterId == chapterId);
        if (chapter == null) return Task.FromResult(false);
        chapter.Status = "ARCHIVED";
        return Task.FromResult(true);
    }
}
