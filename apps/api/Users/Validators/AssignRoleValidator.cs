using FluentValidation;
using api.Users.DTOs;

namespace api.Users.Validators;

public class AssignRoleValidator : AbstractValidator<AssignRoleRequest>
{
    public AssignRoleValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("RoleId là bắt buộc.")
            .Matches(@"^[0-9a-fA-F]{24}$").WithMessage("RoleId phải là MongoDB ObjectId hợp lệ (24 ký tự hex).");

        RuleFor(x => x.BranchId)
            .Matches(@"^[0-9a-fA-F]{24}$").WithMessage("BranchId phải là MongoDB ObjectId hợp lệ (24 ký tự hex).")
            .When(x => !string.IsNullOrEmpty(x.BranchId));

        RuleFor(x => x.ExpiresAt)
            .GreaterThan(System.DateTime.UtcNow).WithMessage("Ngày hết hạn phải lớn hơn thời gian hiện tại.")
            .When(x => x.ExpiresAt.HasValue);
    }
}
