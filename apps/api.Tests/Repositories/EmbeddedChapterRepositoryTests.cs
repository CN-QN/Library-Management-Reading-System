using api.Tests.TestSupport;
using FluentAssertions;
using Xunit;

namespace api.Tests.Repositories;

public class EmbeddedChapterRepositoryTests : IClassFixture<MongoFixture>
{
    private readonly MongoFixture _fixture;

    public EmbeddedChapterRepositoryTests(MongoFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task AddChapter_pushes_into_the_book_aggregate_and_updates_total()
    {
        var repository = _fixture.CreateBookRepositoryWithEmptyBook();
        if (repository is null)
        {
            // MONGODB_TEST_CONNECTION_STRING not configured; skip.
            return;
        }

        var added = await repository.AddChapterAsync("book-1", TestBooks.Chapter(1));
        var book = await repository.GetByIdAsync("book-1");

        added.Should().BeTrue();
        book!.Chapters.Should().ContainSingle();
        book.TotalChapters.Should().Be(1);
    }

    [Fact]
    public async Task GetChapter_requires_both_book_and_chapter_identity()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        (await repository.GetChapterByIdAsync("book-2", "chapter-1")).Should().BeNull();
    }

    [Fact]
    public async Task GetChapterByIdAsync_returns_chapter_when_both_ids_match()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        var chapter = await repository.GetChapterByIdAsync("book-1", "chapter-1");

        chapter.Should().NotBeNull();
        chapter!.ChapterId.Should().Be("chapter-1");
    }

    [Fact]
    public async Task GetChaptersByBookIdAsync_returns_all_chapters_for_the_book()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        var chapters = await repository.GetChaptersByBookIdAsync("book-1");

        chapters.Should().ContainSingle();
        chapters[0].ChapterId.Should().Be("chapter-1");
    }

    [Fact]
    public async Task GetChaptersByBookIdAsync_returns_empty_list_for_missing_book()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        var chapters = await repository.GetChaptersByBookIdAsync("does-not-exist");

        chapters.Should().BeEmpty();
    }

    [Fact]
    public async Task GetChapterByNumberAsync_returns_chapter_with_matching_number()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        var chapter = await repository.GetChapterByNumberAsync("book-1", 1);

        chapter.Should().NotBeNull();
    }

    [Fact]
    public async Task GetChapterByNumberAsync_returns_null_for_wrong_number()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        var chapter = await repository.GetChapterByNumberAsync("book-1", 99);

        chapter.Should().BeNull();
    }

    [Fact]
    public async Task ArchiveChapterAsync_sets_chapter_status_to_ARCHIVED()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        var archived = await repository.ArchiveChapterAsync("book-1", "chapter-1");
        var chapter = await repository.GetChapterByIdAsync("book-1", "chapter-1");

        archived.Should().BeTrue();
        chapter!.Status.Should().Be("ARCHIVED");
    }

    [Fact]
    public async Task ArchiveChapterAsync_returns_false_for_wrong_book()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        var result = await repository.ArchiveChapterAsync("wrong-book", "chapter-1");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task ReplaceChaptersAsync_replaces_chapter_list_and_updates_totalChapters()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        var newChapters = new[]
        {
            TestBooks.Chapter(1),
            TestBooks.Chapter(2)
        };

        var result = await repository.ReplaceChaptersAsync("book-1", newChapters);
        var book = await repository.GetByIdAsync("book-1");

        result.Should().BeTrue();
        book!.Chapters.Should().HaveCount(2);
        book.TotalChapters.Should().Be(2);
    }

    [Fact]
    public async Task ReplaceChapterAsync_replaces_specific_chapter_in_aggregate()
    {
        var repository = _fixture.CreateRepositoryWithChapter("book-1", "chapter-1");
        if (repository is null) return;

        var replacement = TestBooks.WithChapter("book-1", "chapter-1");
        replacement.Title = "Updated Title";

        var result = await repository.ReplaceChapterAsync("book-1", "chapter-1", replacement);
        var chapter = await repository.GetChapterByIdAsync("book-1", "chapter-1");

        result.Should().BeTrue();
        chapter!.Title.Should().Be("Updated Title");
    }
}
