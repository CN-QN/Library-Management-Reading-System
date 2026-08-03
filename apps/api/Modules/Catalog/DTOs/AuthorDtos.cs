using System.ComponentModel.DataAnnotations;

namespace api.Modules.Catalog.DTOs
{
    public class CreateAuthorDto
    {
        [Required(ErrorMessage = "Tên tác giả không được để trống")]
        [StringLength(200, ErrorMessage = "Tên tác giả không được vượt quá 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        public string? Biography { get; set; }

        public string? Avatar { get; set; }
    }

    public class UpdateAuthorDto
    {
        [Required(ErrorMessage = "Tên tác giả không được để trống")]
        [StringLength(200, ErrorMessage = "Tên tác giả không được vượt quá 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        public string? Biography { get; set; }

        public string? Avatar { get; set; }
    }

    public class AuthorResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Biography { get; set; }
        public string? Avatar { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
