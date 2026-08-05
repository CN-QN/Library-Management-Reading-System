using api.Database.Entities;

namespace api.Tests.TestSupport;

public static class TestContent
{
    public static ChapterContent OneParagraph(string text = "Một đoạn văn mẫu") => new()
    {
        Paragraphs = [new Paragraph { Id = "paragraph-1", Order = 1, Text = text }]
    };
}
