using api.Modules.ReservationsAndFines.DTOs;

namespace api.Modules.ReservationsAndFines.Services
{
    public interface IFineService
    {
        Task<(List<FineResponseDto> Items, long Total)> GetFinesAsync(string? userId, string? status, string? reason, int page, int limit);
        Task<FineResponseDto?> GetFineByIdAsync(string id);
        Task<FineResponseDto> PayFineAsync(string fineId, PayFineDto dto);
        Task<FineResponseDto> WaiveFineAsync(string fineId, WaiveFineDto dto, string actorUserId);
    }
}
