using api.Database.Entities;
using api.Tests.TestSupport;
using FluentAssertions;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using Xunit;

namespace api.Tests.Database;

public sealed class BookEmbeddedModelTests
{
    [Fact]
    public void Book_round_trips_embedded_metadata_and_chapters_through_bson()
    {
        var book = TestBooks.WithOnePublishedChapter();

        var document = book.ToBsonDocument();
        var roundTripped = BsonSerializer.Deserialize<Book>(document);

        roundTripped.Authors.Should().ContainSingle(a => a.Name == "Tô Hoài");
        roundTripped.Categories.Should().ContainSingle(c => c.Slug == "van-hoc");
        roundTripped.Publisher!.Name.Should().Be("NXB Kim Đồng");
        roundTripped.Chapters.Should().ContainSingle(c => c.Content.Paragraphs[0].Text.Contains("ăn uống"));
    }

    [Fact]
    public void Book_chapter_identity_is_not_a_foreign_key_collection_reference()
    {
        var chapter = TestBooks.WithOnePublishedChapter().Chapters.Single();

        chapter.ChapterId.Should().NotBeNullOrWhiteSpace();
        chapter.Number.Should().Be(1);
    }
}
