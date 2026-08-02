using api.Modules.ReservationsAndFines.DTOs;

namespace api.Modules.ReservationsAndFines.Services
{
    public interface IReservationService
    {
        Task<ReservationResponseDto> CreateReservationAsync(CreateReservationDto dto);
        Task<ReservationResponseDto> CancelReservationAsync(string reservationId, string userId);
        Task<ReservationResponseDto> FulfillReservationAsync(string reservationId);
        Task<(List<ReservationResponseDto> Items, long Total)> GetReservationsAsync(string? userId, string? bookId, string? branchId, string? status, int page, int limit);
        Task<ReservationResponseDto?> GetReservationByIdAsync(string id);
        Task CheckAndProcessExpiredReservationsAsync();
    }
}
