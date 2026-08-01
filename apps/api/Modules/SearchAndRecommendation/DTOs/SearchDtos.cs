using System.ComponentModel.DataAnnotations;

namespace api.Modules.SearchAndRecommendation.DTOs
{
    public class BookSearchFilterDto
    {
        public string? Keyword { get; set; }
        public string? CategoryId { get; set; }
        public string? AuthorId { get; set; }
        public int? MinYear { get; set; }
        public int? MaxYear { get; set; }
        public string? Language { get; set; }
        public string? AccessType { get; set; } // FREE, PREMIUM

        public string SortBy { get; set; } = "views_desc"; // title_asc, title_desc, year_asc, year_desc, views_desc, rating_desc

        [Range(1, int.MaxValue, ErrorMessage = "Page phải lớn hơn hoặc bằng 1.")]
        public int Page { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "Limit phải từ 1 đến 100.")]
        public int Limit { get; set; } = 10;
    }

    public class AuthorSearchDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public class CategorySearchDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public class BookSearchDto
    {
        public string BookId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ISBN { get; set; }
        public string? Summary { get; set; }
        public string? PublisherId { get; set; }
        public string? CoverAssetId { get; set; }
        public string AccessType { get; set; } = "FREE";
        public string Status { get; set; } = "PUBLISHED";
        public int? PublicationYear { get; set; }
        public string Language { get; set; } = "vi";
        public int TotalChapters { get; set; }

        public int ViewCount { get; set; }
        public int ReadingCount { get; set; }
        public double Rating { get; set; }
        public int RatingCount { get; set; }

        public List<AuthorSearchDto> Authors { get; set; } = new();
        public List<CategorySearchDto> Categories { get; set; } = new();
    }

    public class SearchSuggestionDto
    {
        public string Type { get; set; } = string.Empty; // BOOK, AUTHOR
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty; // Book title or Author name
        public string? Subtext { get; set; } // Author name for Book; Bio for Author
    }
}
