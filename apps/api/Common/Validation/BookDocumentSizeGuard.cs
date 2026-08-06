using api.Database.Entities;
using MongoDB.Bson;

namespace api.Common.Validation;

public static class BookDocumentSizeGuard
{
    public const int MaxBytes = 12 * 1024 * 1024;

    public static void Validate(Book book)
    {
        ArgumentNullException.ThrowIfNull(book);

        var bytes = book.ToBson().Length;
        if (bytes > MaxBytes)
        {
            throw new InvalidOperationException($"Book document exceeds the 12 MB application limit ({bytes} bytes).");
        }
    }
}
