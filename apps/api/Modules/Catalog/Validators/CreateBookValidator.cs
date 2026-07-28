using FluentValidation;
using api.Modules.Catalog.DTOs.Requests;

namespace api.Modules.Catalog.Validators
{
    public class CreateBookValidator : AbstractValidator<CreateBookDto>
    {
        public CreateBookValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required")
                .MaximumLength(200).WithMessage("Title cannot exceed 200 characters");

            RuleFor(x => x.Slug)
                .NotEmpty().WithMessage("Slug is required")
                .Matches("^[a-z0-9-]+$").WithMessage("Slug can only contain lowercase letters, numbers and hyphens")
                .MaximumLength(100).WithMessage("Slug cannot exceed 100 characters");

            RuleFor(x => x.ISBN)
                .Matches("^(97(8|9))?[0-9]{9}[0-9X]$").When(x => !string.IsNullOrEmpty(x.ISBN))
                .WithMessage("Invalid ISBN format. Must be ISBN-10 or ISBN-13");

            RuleFor(x => x.PublicationYear)
                .InclusiveBetween(1900, DateTime.UtcNow.Year)
                .When(x => x.PublicationYear.HasValue)
                .WithMessage($"Publication year must be between 1900 and {DateTime.UtcNow.Year}");
        }
    }
}