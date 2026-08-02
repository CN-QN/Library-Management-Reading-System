using FluentValidation;

namespace api.Modules.ReservationsAndFines.DTOs
{
    public class CreateReservationDto
    {
        public string UserId { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public string BranchId { get; set; } = string.Empty;
        public string? Note { get; set; }
    }

    public class CreateReservationDtoValidator : AbstractValidator<CreateReservationDto>
    {
        public CreateReservationDtoValidator()
        {
            RuleFor(x => x.UserId).NotEmpty().WithMessage("UserId không được để trống.");
            RuleFor(x => x.BookId).NotEmpty().WithMessage("BookId không được để trống.");
            RuleFor(x => x.BranchId).NotEmpty().WithMessage("BranchId không được để trống.");
        }
    }

    public class ReservationResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? StudentCode { get; set; }
        public string BookId { get; set; } = string.Empty;
        public string? BookTitle { get; set; }
        public string BranchId { get; set; } = string.Empty;
        public string? BranchName { get; set; }
        public string Status { get; set; } = "WAITING";
        public int QueuePosition { get; set; }
        public DateTime ReservedAt { get; set; }
        public DateTime? ReadyUntil { get; set; }
        public DateTime? FulfilledAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? Note { get; set; }
    }
}
