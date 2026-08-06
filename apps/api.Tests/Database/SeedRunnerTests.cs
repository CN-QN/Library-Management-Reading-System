using api.Database.Entities;
using api.Tests.TestSupport;
using FluentAssertions;
using MongoDB.Driver;
using Xunit;

namespace api.Tests.Database;

public sealed class SeedRunnerTests(MongoFixture Fixture) : IClassFixture<MongoFixture>
{
    [Fact]
    public async Task Seed_creates_complete_books_without_standalone_catalog_collections()
    {
        if (Fixture.Database is null) return;
        
        await Fixture.RunSeedAsync();

        var book = await Fixture.Database.GetCollection<Book>("books")
            .Find(Builders<Book>.Filter.Empty)
            .FirstAsync();

        book.Authors.Should().NotBeEmpty();
        book.Categories.Should().NotBeEmpty();
        book.Publisher.Should().NotBeNull();
        book.Chapters.Should().NotBeEmpty();
        (await Fixture.Database.ListCollectionNames().ToListAsync())
            .Should().NotContain(new[] { "authors", "categories", "publishers", "chapters", "book_authors", "book_categories" });
    }
}
