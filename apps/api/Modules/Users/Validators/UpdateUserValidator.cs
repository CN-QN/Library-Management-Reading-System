using FluentValidation;
using api.Users.DTOs;
using api.Database;
using MongoDB.Driver;

namespace api.Users.Validators;

public class UpdateUserValidator : AbstractValidator<UpdateUserRequest>
{
    private readonly MongoDbContext _context;

    public UpdateUserValidator(MongoDbContext context)
    {
        _context = context;

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên là bắt buộc.")
            .MinimumLength(2).WithMessage("Họ tên tối thiểu 2 ký tự.")
            .MaximumLength(100).WithMessage("Họ tên tối đa 100 ký tự.")
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Họ tên không được chứa toàn khoảng trắng.");

        RuleFor(x => x.Avatar)
            .Must(uri => System.Uri.TryCreate(uri, UriKind.Absolute, out _)).WithMessage("Avatar phải là một URL hợp lệ.")
            .When(x => !string.IsNullOrEmpty(x.Avatar));

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
