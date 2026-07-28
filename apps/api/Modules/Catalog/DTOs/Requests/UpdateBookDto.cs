namespace api.Modules.Catalog.DTOs.Requests
{
    public class UpdateBookDto
    {
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public int? PublicationYear { get; set; }
        public string? Language { get; set; }
        public string? AccessType { get; set; }
    }
}