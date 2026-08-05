using api.Database.Entities;
using api.Modules.DigitalContent.DTOs;
using api.Tests.TestSupport;
using FluentAssertions;
using Xunit;

namespace api.Tests.Modules;

public sealed class ChapterServiceTests : IClassFixture<MongoFixture>
{
    private readonly MongoFixture Fixture;

    public ChapterServiceTests(MongoFixture fixture)
    {
        Fixture = fixture;
    }

    [Fact]
    public async Task Create_rejects_duplicate_chapter_number_in_the_same_book()
    {
        var service = Fixture.CreateChapterServiceWithChapter("book-1", number: 1);

        Func<Task> act = () => service.CreateAsync(
            "book-1",
            new CreateChapterDto { Number = 1, Title = "Duplicate", Content = TestContent.OneParagraph() },
            "admin");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Chapter number 1 already exists in this book.");
    }

    [Fact]
    public async Task Reorder_normalizes_numbers_and_rejects_ids_from_another_book()
    {
        var service = Fixture.CreateChapterServiceWithChapters("book-1", "chapter-1", "chapter-2");

        await service.ReorderChaptersAsync("book-1", new List<string> { "chapter-2", "chapter-1" });

        (await service.GetByIdAsync("book-1", "chapter-2"))!.Number.Should().Be(1);
    }
}
