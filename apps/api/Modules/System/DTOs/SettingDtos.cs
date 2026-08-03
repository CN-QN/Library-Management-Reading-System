using System.ComponentModel.DataAnnotations;

namespace api.Modules.System.DTOs
{
    public class SystemSettingDto
    {
        public string Id { get; set; } = string.Empty;
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Scope { get; set; } = "SYSTEM";
        public string? Description { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateSettingDto
    {
        [Required(ErrorMessage = "Giá trị cài đặt không được để trống")]
        public string Value { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Scope { get; set; }
    }
}
