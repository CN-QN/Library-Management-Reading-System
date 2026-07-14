using FluentValidation;
using api.Auth.DTOs;

namespace api.Auth.Validators;

public class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token là bắt buộc.");
    }
}
