using FluentValidation;
using api.Roles.DTOs;
using api.Database;
using MongoDB.Driver;

namespace api.Roles.Validators;

public class AssignPermissionValidator : AbstractValidator<AssignPermissionRequest>
{
    private readonly MongoDbContext _context;

    public AssignPermissionValidator(MongoDbContext context)
    {
        _context = context;

        RuleFor(x => x.PermissionId)
            .NotEmpty().WithMessage("PermissionId là bắt buộc.")
            .Matches(@"^[0-9a-fA-F]{24}$").WithMessage("PermissionId phải là MongoDB ObjectId hợp lệ (24 ký tự hex).")
            .MustAsync(async (permId, cancellation) =>
            {
                var exists = await _context.Permissions.Find(p => p.Id == permId).AnyAsync(cancellation);
                return exists;
            }).WithMessage("Quyền (PermissionId) không tồn tại trong hệ thống.");
    }
}
