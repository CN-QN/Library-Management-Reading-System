using System.ComponentModel.DataAnnotations;

namespace api.Modules.Reading.DTOs
{
    public class SaveReadingProgressDto
    {
        [Required(ErrorMessage = "BookId là bắt buộc.")]
        public string BookId { get; set; } = string.Empty;

        [Required(ErrorMessage = "ChapterId là bắt buộc.")]
        public string ChapterId { get; set; } = string.Empty;

        [Range(0, int.MaxValue, ErrorMessage = "ChapterNumber phải lớn hơn hoặc bằng 0.")]
        public int ChapterNumber { get; set; }

        [Range(0.0, double.MaxValue, ErrorMessage = "ScrollPosition phải lớn hơn hoặc bằng 0.")]
        public double ScrollPosition { get; set; }

        [Range(0.0, 100.0, ErrorMessage = "Percentage phải từ 0.0 đến 100.0.")]
        public double Percentage { get; set; }

        [Range(1, long.MaxValue, ErrorMessage = "Version phải lớn hơn hoặc bằng 1.")]
        public long Version { get; set; }

        public string Status { get; set; } = "READING"; // READING, COMPLETED
    }

    public class ReadingProgressResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public string ChapterId { get; set; } = string.Empty;
        public int ChapterNumber { get; set; }
        public double ScrollPosition { get; set; }
        public double Percentage { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime LastReadAt { get; set; }
        public long Version { get; set; }
    }
}
