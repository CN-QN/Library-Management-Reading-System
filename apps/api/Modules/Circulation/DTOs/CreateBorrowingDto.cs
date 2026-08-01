using FluentValidation;

namespace api.Modules.Circulation.DTOs
{
    public class CreateBorrowingDto
    {
        public string UserId { get; set; } = string.Empty;
        public string BranchId { get; set; } = string.Empty;
        public List<string> CopyIds { get; set; } = new();
        public int DaysToBorrow { get; set; } = 14;
        public string? Note { get; set; }
    }

    public class CreateBorrowingDtoValidator : AbstractValidator<CreateBorrowingDto>
    {
        public CreateBorrowingDtoValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống.");

            RuleFor(x => x.BranchId)
                .NotEmpty().WithMessage("BranchId không được để trống.");

            RuleFor(x => x.CopyIds)
                .NotEmpty().WithMessage("Danh sách mã bản sao sách (CopyIds) không được để trống.")
                .Must(x => x.Count >= 1 && x.Count <= 5).WithMessage("Mỗi lượt mượn chỉ được từ 1 đến 5 cuốn sách.");

            RuleFor(x => x.DaysToBorrow)
                .InclusiveBetween(1, 30).WithMessage("Số ngày mượn phải từ 1 đến 30 ngày.");
        }
    }
}
