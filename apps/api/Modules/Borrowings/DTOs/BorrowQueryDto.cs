using MongoDB.Bson;
namespace api.Modules.Borrowings.DTOs
{
    public class BorrowQueryDto
    {
        public string? UserId { get; set; }
        public string? Status { get; set; } // ACTIVE, RETURNED, OVERDUE, LOST
        public string? Keyword { get; set; }
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public string? SortBy { get; set; } = "borrowDate";
        public bool Descending { get; set; } = true;
    }
}