namespace api.Modules.Catalog.DTOs;

public class BookAuthorDto
{
    public string AuthorId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Role { get; set; } = "AUTHOR";
    public int Order { get; set; }
}

public class BookCategoryDto
{
    public string CategoryId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class BookPublisherDto
{
    public string PublisherId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}
