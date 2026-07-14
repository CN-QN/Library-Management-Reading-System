using FluentValidation;
using api.Auth.DTOs;

namespace api.Auth.Validators;

public class RegisterValidator : AbstractValidator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc.")
            .EmailAddress().WithMessage("Email không đúng định dạng.")
            .MaximumLength(255).WithMessage("Email tối đa 255 ký tự.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu là bắt buộc.")
            .MinimumLength(8).WithMessage("Mật khẩu tối thiểu 8 ký tự.")
            .MaximumLength(128).WithMessage("Mật khẩu tối đa 128 ký tự.")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa.")
            .Matches(@"[a-z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ thường.")
            .Matches(@"[0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ số.")
            .Matches(@"[!@#$%^&*()_+=\-\[\]{};':"",.<>/?|\\~`]").WithMessage("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên là bắt buộc.")
            .MinimumLength(2).WithMessage("Họ tên tối thiểu 2 ký tự.")
            .MaximumLength(100).WithMessage("Họ tên tối đa 100 ký tự.")
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Họ tên không được chứa toàn khoảng trắng.");

        RuleFor(x => x.StudentCode)
            .NotEmpty().WithMessage("Mã sinh viên là bắt buộc.")
            .MinimumLength(5).WithMessage("Mã sinh viên tối thiểu 5 ký tự.")
            .MaximumLength(20).WithMessage("Mã sinh viên tối đa 20 ký tự.")
            .Matches(@"^[a-zA-Z0-9]+$").WithMessage("Mã sinh viên chỉ được phép chứa chữ cái và số.");
    }
}
