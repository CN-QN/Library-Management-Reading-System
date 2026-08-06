using api.Database.Entities;
using api.Modules.Catalog.DTOs;

namespace api.Modules.Catalog.DTOs.Requests;

public class UpdateBookDto
{
    public string? Title { get; set; }
    public string? Summary { get; set; }
    [Obsolete("Use Publisher instead.")]
    public string? PublisherId { get; set; }
    public int? PublicationYear { get; set; }
    public string? Language { get; set; }
    public string? AccessType { get; set; }
    public decimal? Price { get; set; }
    public string? CoverAssetId { get; set; }
    public List<BookAuthorDto>? Authors { get; set; }
    public List<BookCategoryDto>? Categories { get; set; }
    [Obsolete("Use Authors instead.")]
    public List<string>? AuthorIds { get; set; }
    [Obsolete("Use Categories instead.")]
    public List<string>? CategoryIds { get; set; }
    public BookPublisherDto? Publisher { get; set; }
    public List<BookChapter>? Chapters { get; set; }
}
