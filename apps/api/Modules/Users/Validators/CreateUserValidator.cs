using FluentValidation;
using api.Users.DTOs;
using api.Database;
using MongoDB.Driver;
using System.Linq;

namespace api.Users.Validators;

public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    private readonly MongoDbContext _context;

    public CreateUserValidator(MongoDbContext context)
    {
        _context = context;

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc.")
            .EmailAddress().WithMessage("Email không đúng định dạng.")
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự.")
            .Must(email => 
            {
                if (string.IsNullOrEmpty(email)) return false;
                var domain = email.Split('@').Last().ToLower();
                return domain == "gmail.com";
            }).WithMessage("Email đăng ký phải thuộc tên miền @gmail.com.")
            .MustAsync(async (email, cancellation) => 
            {
                var exists = await _context.Users.Find(u => u.Email == email).AnyAsync(cancellation);
                return !exists;
            }).WithMessage("Email này đã được đăng ký trong hệ thống.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu là bắt buộc.")
            .MinimumLength(8).WithMessage("Mật khẩu tối thiểu 8 ký tự.")
            .MaximumLength(32).WithMessage("Mật khẩu tối đa 32 ký tự.")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa.")
            .Matches(@"[a-z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ thường.")
            .Matches(@"[0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ số.")
            .Matches(@"[!@#$%^&*()_+=\-\[\]{};':"",.<>/?|\\~`]").WithMessage("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên là bắt buộc.")
            .MinimumLength(2).WithMessage("Họ tên tối thiểu 2 ký tự.")
            .MaximumLength(50).WithMessage("Họ tên tối đa 50 ký tự.")
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Họ tên không được chứa toàn khoảng trắng.");

        RuleFor(x => x.StudentCode)
            .NotEmpty().WithMessage("Mã sinh viên là bắt buộc.")
            .Matches(@"^[0-9]{8,12}$").WithMessage("Mã sinh viên phải là dãy số từ 8 đến 12 chữ số.")
            .MustAsync(async (code, cancellation) => 
            {
                var exists = await _context.Users.Find(u => u.StudentCode == code).AnyAsync(cancellation);
                return !exists;
            }).WithMessage("Mã sinh viên này đã được đăng ký trong hệ thống.");

        RuleFor(x => x.BranchId)
            .Matches(@"^[0-9a-fA-F]{24}$").WithMessage("BranchId phải là MongoDB ObjectId hợp lệ (24 ký tự hex).")
            .MustAsync(async (branchId, cancellation) =>
            {
                var exists = await _context.LibraryBranches.Find(b => b.Id == branchId).AnyAsync(cancellation);
                return exists;
            }).WithMessage("Chi nhánh (BranchId) không tồn tại trong hệ thống.")
            .When(x => !string.IsNullOrEmpty(x.BranchId));
    }
}
