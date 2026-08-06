using api.Database.Entities;
using api.Modules.Catalog.DTOs;

namespace api.Modules.Catalog.DTOs.Responses;

public class BookResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ISBN { get; set; }
    public string? Summary { get; set; }
    [Obsolete("Use Publisher instead.")]
    public string? PublisherName { get; set; }
    public int? PublicationYear { get; set; }
    public string Language { get; set; } = "vi";
    public string AccessType { get; set; } = "FREE";
    public decimal Price { get; set; }
    public string Status { get; set; } = "DRAFT";
    public string? CoverAssetId { get; set; }
    public int TotalChapters { get; set; }
    public int ViewCount { get; set; }
    public int ReadingCount { get; set; }
    public double Rating { get; set; }
    public int RatingCount { get; set; }
    public List<BookAuthorDto> Authors { get; set; } = new();
    public List<BookCategoryDto> Categories { get; set; } = new();
    [Obsolete("Use Authors instead.")]
    public List<string> AuthorIds { get; set; } = new();
    [Obsolete("Use Categories instead.")]
    public List<string> CategoryIds { get; set; } = new();
    [Obsolete("Use Authors instead.")]
    public List<string> AuthorNames { get; set; } = new();
    [Obsolete("Use Categories instead.")]
    public List<string> CategoryNames { get; set; } = new();
    public BookPublisherDto? Publisher { get; set; }
    public List<BookChapter> Chapters { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
