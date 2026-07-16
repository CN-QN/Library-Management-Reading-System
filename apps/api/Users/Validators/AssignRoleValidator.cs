using FluentValidation;
using api.Users.DTOs;
using api.Database;
using MongoDB.Driver;

namespace api.Users.Validators;

public class AssignRoleValidator : AbstractValidator<AssignRoleRequest>
{
    private readonly MongoDbContext _context;

    public AssignRoleValidator(MongoDbContext context)
    {
        _context = context;

        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("RoleId là bắt buộc.")
            .Matches(@"^[0-9a-fA-F]{24}$").WithMessage("RoleId phải là MongoDB ObjectId hợp lệ (24 ký tự hex).")
            .MustAsync(async (roleId, cancellation) =>
            {
                var exists = await _context.Roles.Find(r => r.Id == roleId).AnyAsync(cancellation);
                return exists;
            }).WithMessage("Vai trò (RoleId) không tồn tại trong hệ thống.");

        RuleFor(x => x.BranchId)
            .Matches(@"^[0-9a-fA-F]{24}$").WithMessage("BranchId phải là MongoDB ObjectId hợp lệ (24 ký tự hex).")
            .MustAsync(async (branchId, cancellation) =>
            {
                var exists = await _context.LibraryBranches.Find(b => b.Id == branchId).AnyAsync(cancellation);
                return exists;
            }).WithMessage("Chi nhánh (BranchId) không tồn tại trong hệ thống.")
            .When(x => !string.IsNullOrEmpty(x.BranchId));

        RuleFor(x => x.ExpiresAt)
            .GreaterThan(System.DateTime.UtcNow).WithMessage("Ngày hết hạn phải lớn hơn thời gian hiện tại.")
            .When(x => x.ExpiresAt.HasValue);
    }
}
