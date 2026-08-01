using FluentValidation;

namespace api.Modules.ReservationsAndFines.DTOs
{
    public class PayFineDto
    {
        public string? Note { get; set; }
    }

    public class WaiveFineDto
    {
        public string Reason { get; set; } = string.Empty;
        public string? Note { get; set; }
    }

    public class WaiveFineDtoValidator : AbstractValidator<WaiveFineDto>
    {
        public WaiveFineDtoValidator()
        {
            RuleFor(x => x.Reason).NotEmpty().WithMessage("Lý do miễn phạt không được để trống.");
        }
    }

    public class FineResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? StudentCode { get; set; }
        public string BorrowingId { get; set; } = string.Empty;
        public string? BorrowingCode { get; set; }
        public string? BorrowingItemId { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "UNPAID";
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? WaivedAt { get; set; }
        public string? WaivedBy { get; set; }
        public string? WaivedByName { get; set; }
        public string? Note { get; set; }
    }
}
