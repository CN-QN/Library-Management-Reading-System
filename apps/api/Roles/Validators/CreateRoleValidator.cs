using FluentValidation;
using api.Roles.DTOs;

namespace api.Roles.Validators;

public class CreateRoleValidator : AbstractValidator<CreateRoleRequest>
{
    public CreateRoleValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã vai trò (Code) là bắt buộc.")
            .Length(2, 50).WithMessage("Mã vai trò phải từ 2 đến 50 ký tự.")
            .Matches(@"^[A-Z0-9_]+$").WithMessage("Mã vai trò chỉ được chứa chữ in hoa, số và ký tự gạch dưới (_). VD: LIBRARY_ADMIN.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên vai trò là bắt buộc.")
            .Length(2, 100).WithMessage("Tên vai trò phải từ 2 đến 100 ký tự.")
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Tên vai trò không được chứa toàn khoảng trắng.");

        RuleFor(x => x.Scope)
            .NotEmpty().WithMessage("Phạm vi vai trò (Scope) là bắt buộc.")
            .Must(scope => scope == "GLOBAL" || scope == "BRANCH")
            .WithMessage("Phạm vi không hợp lệ. Chỉ chấp nhận: GLOBAL hoặc BRANCH.");
    }
}
