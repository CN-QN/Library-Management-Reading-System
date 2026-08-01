using FluentValidation;

namespace api.Modules.Circulation.DTOs
{
    public class ReturnItemRequestDto
    {
        public string ItemId { get; set; } = string.Empty;
        public string ConditionIn { get; set; } = "GOOD";
        public string? Note { get; set; }
    }

    public class ReturnItemsDto
    {
        public List<ReturnItemRequestDto> ReturnedItems { get; set; } = new();
    }

    public class ReturnItemsDtoValidator : AbstractValidator<ReturnItemsDto>
    {
        public ReturnItemsDtoValidator()
        {
            RuleFor(x => x.ReturnedItems)
                .NotEmpty().WithMessage("Danh sách sách trả không được để trống.");

            RuleForEach(x => x.ReturnedItems).ChildRules(item =>
            {
                item.RuleFor(i => i.ItemId).NotEmpty().WithMessage("ItemId không được để trống.");
                item.RuleFor(i => i.ConditionIn).NotEmpty().WithMessage("Tình trạng sách trả không được để trống.");
            });
        }
    }
}
