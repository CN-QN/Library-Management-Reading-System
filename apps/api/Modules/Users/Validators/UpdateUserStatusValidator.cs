using FluentValidation;
using api.Users.DTOs;
using api.Common.Constants;

namespace api.Users.Validators;

public class UpdateUserStatusValidator : AbstractValidator<UpdateUserStatusRequest>
{
    private static readonly string[] AllowedStatuses = {
        StatusValues.User.PENDING,
        StatusValues.User.ACTIVE,
        StatusValues.User.LOCKED,
        StatusValues.User.SUSPENDED,
        StatusValues.User.DELETED
    };

    public UpdateUserStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái là bắt buộc.")
            .Must(status => AllowedStatuses.Contains(status))
            .WithMessage($"Trạng thái không hợp lệ. Chỉ chấp nhận: {string.Join(", ", AllowedStatuses)}.");
    }
}
