using FluentValidation;
using api.Roles.DTOs;

namespace api.Roles.Validators;

public class AssignPermissionValidator : AbstractValidator<AssignPermissionRequest>
{
    public AssignPermissionValidator()
    {
        RuleFor(x => x.PermissionId)
            .NotEmpty().WithMessage("PermissionId là bắt buộc.")
            .Matches(@"^[0-9a-fA-F]{24}$").WithMessage("PermissionId phải là MongoDB ObjectId hợp lệ (24 ký tự hex).");
    }
}
