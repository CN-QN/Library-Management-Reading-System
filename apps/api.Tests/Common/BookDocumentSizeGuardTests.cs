using api.Common.Validation;
using api.Database.Entities;
using api.Tests.TestSupport;
using FluentAssertions;
using Xunit;

namespace api.Tests.Common;

public class BookDocumentSizeGuardTests
{
    [Fact]
    public void Validate_accepts_book_below_12_mb()
    {
        var book = TestBooks.WithParagraphText(11 * 1024 * 1024);

        Action act = () => BookDocumentSizeGuard.Validate(book);

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_rejects_book_above_12_mb_before_write()
    {
        var book = TestBooks.WithParagraphText(12 * 1024 * 1024 + 1);

        Action act = () => BookDocumentSizeGuard.Validate(book);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Book document exceeds the 12 MB application limit*");
    }
}
