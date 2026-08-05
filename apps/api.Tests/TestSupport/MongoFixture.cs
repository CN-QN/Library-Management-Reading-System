using api.Database.Entities;
using api.Modules.DigitalContent.Services;
using api.Repositories.Implementations;
using api.Repositories.Interfaces;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using Xunit;

namespace api.Tests.TestSupport;

public sealed class MongoFixture : IAsyncLifetime
{
    private readonly MongoClient? _client;
    public IMongoDatabase? Database { get; }
    public string DatabaseName { get; } = $"libraryhub_tests_{Guid.NewGuid():N}";

    public MongoFixture()
    {
        var connectionString = Environment.GetEnvironmentVariable("MONGODB_TEST_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return;
        }

        _client = new MongoClient(connectionString);
        Database = _client.GetDatabase(DatabaseName);
    }

    public Task InitializeAsync()
    {
        if (_client is null)
        {
            Console.WriteLine("Assumption: MONGODB_TEST_CONNECTION_STRING is not configured; MongoDB integration operations are skipped.");
        }

        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (_client is not null)
        {
            await _client.DropDatabaseAsync(DatabaseName);
        }
    }

    /// <summary>
    /// Creates a BookRepository backed by a fresh MongoDB collection that contains
    /// a single empty book with Id = "book-1".
    /// Returns null when the MongoDB connection string is not configured.
    /// </summary>
    public IBookRepository? CreateBookRepositoryWithEmptyBook()
    {
        if (Database is null) return null;

        var collection = Database.GetCollection<Book>("books");
        var emptyBook = new Book
        {
            Id = "book-1",
            Title = "Empty Book",
            Slug = "empty-book"
        };
        collection.InsertOne(emptyBook);

        return new BookRepository(Database);
    }

    /// <summary>
    /// Creates a BookRepository backed by a fresh MongoDB collection that contains
    /// a book with the given bookId, which already has one chapter with the given chapterId.
    /// Returns null when the MongoDB connection string is not configured.
    /// </summary>
    public IBookRepository? CreateRepositoryWithChapter(string bookId, string chapterId)
    {
        if (Database is null) return null;

        var collection = Database.GetCollection<Book>("books");
        var chapter = TestBooks.WithChapter(bookId, chapterId);
        var book = new Book
        {
            Id = bookId,
            Title = "Book With Chapter",
            Slug = $"book-{bookId}",
            Chapters = new List<BookChapter> { chapter },
            TotalChapters = 1
        };
        collection.InsertOne(book);

        return new BookRepository(Database);
    }

    // ── Unit-test helpers (no MongoDB required) ──────────────────────────────

    /// <summary>
    /// Creates an in-memory ChapterService that already contains book "book-1"
    /// with one chapter at the given number.
    /// </summary>
    public ChapterService CreateChapterServiceWithChapter(string bookId, int number)
    {
        var chapter = TestBooks.Chapter(number);
        var book = new Book
        {
            Id = bookId,
            Title = "Test Book",
            Slug = $"test-book-{bookId}",
            Chapters = new List<BookChapter> { chapter },
            TotalChapters = 1
        };

        var repo = new FakeBookRepository(new[] { book });
        return new ChapterService(repo, NullLogger<ChapterService>.Instance);
    }

    /// <summary>
    /// Creates an in-memory ChapterService that already contains book "book-1"
    /// with chapters having the supplied chapterIds (numbered 1..N).
    /// </summary>
    public ChapterService CreateChapterServiceWithChapters(string bookId, params string[] chapterIds)
    {
        var chapters = chapterIds
            .Select((id, idx) =>
            {
                var ch = TestBooks.WithChapter(bookId, id);
                ch.Number = idx + 1;
                return ch;
            })
            .ToList();

        var book = new Book
        {
            Id = bookId,
            Title = "Test Book",
            Slug = $"test-book-{bookId}",
            Chapters = chapters,
            TotalChapters = chapters.Count
        };

        var repo = new FakeBookRepository(new[] { book });
        return new ChapterService(repo, NullLogger<ChapterService>.Instance);
    }
}
