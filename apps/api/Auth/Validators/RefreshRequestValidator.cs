using FluentValidation;
using api.Auth.DTOs;
using Microsoft.AspNetCore.Http;

namespace api.Auth.Validators;

public class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator(IHttpContextAccessor httpContextAccessor)
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty()
            .When(x => httpContextAccessor.HttpContext?.Request.Cookies.ContainsKey("refreshToken") != true)
            .WithMessage("Refresh token là bắt buộc.");
    }
}
