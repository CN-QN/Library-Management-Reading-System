using System.ComponentModel.DataAnnotations;

namespace api.Modules.Reading.DTOs
{
    public class StartReadingSessionDto
    {
        [Required(ErrorMessage = "BookId là bắt buộc.")]
        public string BookId { get; set; } = string.Empty;

        [Required(ErrorMessage = "ChapterId là bắt buộc.")]
        public string ChapterId { get; set; } = string.Empty;

        public string Device { get; set; } = "UNKNOWN"; // Web, Mobile, Tablet, etc.
    }

    public class ReadingSessionResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public string ChapterId { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime LastHeartbeatAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public int DurationSeconds { get; set; }
        public string Device { get; set; } = string.Empty;
    }
}
