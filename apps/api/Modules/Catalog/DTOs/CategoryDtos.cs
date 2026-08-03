using System.ComponentModel.DataAnnotations;

namespace api.Modules.Catalog.DTOs
{
    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "Tên thể loại không được để trống")]
        [StringLength(100, ErrorMessage = "Tên thể loại không quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? ParentId { get; set; }
        public string Status { get; set; } = "ACTIVE";
        public int DisplayOrder { get; set; } = 0;
    }

    public class UpdateCategoryDto
    {
        [Required(ErrorMessage = "Tên thể loại không được để trống")]
        [StringLength(100, ErrorMessage = "Tên thể loại không quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? ParentId { get; set; }
        public string Status { get; set; } = "ACTIVE";
        public int DisplayOrder { get; set; } = 0;
    }
}
