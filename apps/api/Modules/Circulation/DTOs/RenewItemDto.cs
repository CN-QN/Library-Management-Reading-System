using FluentValidation;

namespace api.Modules.Circulation.DTOs
{
    public class RenewItemDto
    {
        public int DaysToExtend { get; set; } = 7;
    }

    public class RenewItemDtoValidator : AbstractValidator<RenewItemDto>
    {
        public RenewItemDtoValidator()
        {
            RuleFor(x => x.DaysToExtend)
                .InclusiveBetween(1, 14).WithMessage("Số ngày gia hạn phải từ 1 đến 14 ngày.");
        }
    }

    public class MarkItemStatusDto
    {
        public string Status { get; set; } = "LOST"; // LOST, DAMAGED
        public string? ConditionIn { get; set; }
        public string? Note { get; set; }
    }

    public class MarkItemStatusDtoValidator : AbstractValidator<MarkItemStatusDto>
    {
        public MarkItemStatusDtoValidator()
        {
            RuleFor(x => x.Status)
                .Must(s => s == "LOST" || s == "DAMAGED").WithMessage("Trạng thái chỉ có thể là LOST hoặc DAMAGED.");
        }
    }
}
