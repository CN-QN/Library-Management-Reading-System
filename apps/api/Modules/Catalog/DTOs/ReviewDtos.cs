using System.ComponentModel.DataAnnotations;

namespace api.Modules.Catalog.DTOs
{
    public class CreateReviewDto
    {
        [Required(ErrorMessage = "Mã sách không được để trống")]
        public string BookId { get; set; } = string.Empty;

        [Range(1, 5, ErrorMessage = "Đánh giá số sao từ 1 đến 5")]
        public int Rating { get; set; }

        [Required(ErrorMessage = "Nội dung nhận xét không được để trống")]
        [StringLength(1000, MinimumLength = 10, ErrorMessage = "Nội dung nhận xét từ 10 đến 1000 ký tự")]
        public string Comment { get; set; } = string.Empty;
    }

    public class UpdateReviewDto
    {
        [Range(1, 5, ErrorMessage = "Đánh giá số sao từ 1 đến 5")]
        public int Rating { get; set; }

        [Required(ErrorMessage = "Nội dung nhận xét không được để trống")]
        [StringLength(1000, MinimumLength = 10, ErrorMessage = "Nội dung nhận xét từ 10 đến 1000 ký tự")]
        public string Comment { get; set; } = string.Empty;
    }

    public class ReviewResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserFullName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string? UserAvatarUrl { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public string Status { get; set; } = "APPROVED";
        public bool IsEdited { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class ReviewStatsDto
    {
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public Dictionary<int, int> Distribution { get; set; } = new();
        public Dictionary<int, int> Percentages { get; set; } = new();
    }
}
