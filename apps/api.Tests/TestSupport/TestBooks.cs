using api.Database.Entities;

namespace api.Tests.TestSupport;

public static class TestBooks
{
    public static Book WithOnePublishedChapter()
    {
        var book = new Book
        {
            Id = "507f1f77bcf86cd799439011",
            Title = "Dế Mèn Phiêu Lưu Ký",
            Slug = "de-men-phieu-luu-ky",
            Authors =
            [
                new BookAuthorSnapshot
                {
                    AuthorId = "author-1",
                    Name = "Tô Hoài",
                    Slug = "to-hoai",
                    Role = "AUTHOR",
                    Order = 1
                }
            ],
            Categories =
            [
                new BookCategorySnapshot
                {
                    CategoryId = "category-1",
                    Name = "Văn học",
                    Slug = "van-hoc"
                }
            ],
            Publisher = new BookPublisherSnapshot
            {
                PublisherId = "publisher-1",
                Name = "NXB Kim Đồng",
                Slug = "nxb-kim-dong"
            }
        };

        book.Chapters.Add(WithChapter(book.Id, "chapter-1"));
        book.TotalChapters = book.Chapters.Count;
        return book;
    }

    public static Book WithParagraphText(int bytes)
    {
        var book = WithOnePublishedChapter();
        book.Chapters[0].Content.Paragraphs =
        [new Paragraph { Id = "paragraph-1", Order = 1, Text = new string('x', bytes) }];
        book.Chapters[0].WordCount = bytes;
        return book;
    }

    public static BookChapter Chapter(int number)
    {
        var chapter = WithChapter("book-1", $"chapter-{number}");
        chapter.Number = number;
        return chapter;
    }

    public static BookChapter WithChapter(string bookId, string chapterId)
    {
        return new BookChapter
        {
            ChapterId = chapterId,
            Number = 1,
            Title = "Tôi sống độc lập từ thuở bé",
            Summary = "Một chương sách mẫu",
            Content = new ChapterContent
            {
                Introduction = "Mở đầu",
                Paragraphs =
                [new Paragraph
                {
                    Id = "paragraph-1",
                    Order = 1,
                    Text = "Bởi tôi ăn uống điều độ và làm việc có chừng mực."
                }],
                Conclusion = "Kết thúc"
            },
            WordCount = 10,
            ReadingTime = 1,
            Status = "PUBLISHED",
            CreatedBy = "test",
            PublishedAt = DateTime.UtcNow
        };
    }
}
