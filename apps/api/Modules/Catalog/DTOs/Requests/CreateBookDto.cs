using api.Modules.Catalog.DTOs;

namespace api.Modules.Catalog.DTOs.Requests;

public class CreateBookDto
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ISBN { get; set; }
    public string? Summary { get; set; }
    [Obsolete("Use Publisher instead.")]
    public string? PublisherId { get; set; }
    public int? PublicationYear { get; set; }
    [Obsolete("Use Authors instead.")]
    public List<string> AuthorIds { get; set; } = new();
    [Obsolete("Use Categories instead.")]
    public List<string> CategoryIds { get; set; } = new();
    public string? Language { get; set; }
    public string? AccessType { get; set; }
    public string? CoverAssetId { get; set; }
    public List<BookAuthorDto> Authors { get; set; } = new();
    public List<BookCategoryDto> Categories { get; set; } = new();
    public BookPublisherDto? Publisher { get; set; }
    public List<api.Database.Entities.BookChapter> Chapters { get; set; } = new();
}
