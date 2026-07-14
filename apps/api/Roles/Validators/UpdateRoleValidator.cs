using FluentValidation;
using api.Roles.DTOs;

namespace api.Roles.Validators;

public class UpdateRoleValidator : AbstractValidator<UpdateRoleRequest>
{
    public UpdateRoleValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên vai trò là bắt buộc.")
            .Length(2, 100).WithMessage("Tên vai trò phải từ 2 đến 100 ký tự.")
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Tên vai trò không được chứa toàn khoảng trắng.");

        RuleFor(x => x.Scope)
            .NotEmpty().WithMessage("Phạm vi vai trò (Scope) là bắt buộc.")
            .Must(scope => scope == "GLOBAL" || scope == "BRANCH")
            .WithMessage("Phạm vi không hợp lệ. Chỉ chấp nhận: GLOBAL hoặc BRANCH.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái vai trò là bắt buộc.")
            .Must(status => status == "ACTIVE" || status == "INACTIVE")
            .WithMessage("Trạng thái không hợp lệ. Chỉ chấp nhận: ACTIVE hoặc INACTIVE.");
    }
}
