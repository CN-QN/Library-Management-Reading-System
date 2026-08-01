using api.Database.Entities;
using api.Modules.ReservationsAndFines.DTOs;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Modules.ReservationsAndFines.Services
{
    public class FineService : IFineService
    {
        private readonly IFineRepository _fineRepository;
        private readonly IBorrowingRepository _borrowingRepository;
        private readonly IMongoCollection<User> _usersCollection;
        private readonly ILogger<FineService> _logger;

        public FineService(
            IFineRepository fineRepository,
            IBorrowingRepository borrowingRepository,
            IMongoDatabase database,
            ILogger<FineService> logger)
        {
            _fineRepository = fineRepository;
            _borrowingRepository = borrowingRepository;
            _usersCollection = database.GetCollection<User>("users");
            _logger = logger;
        }

        public async Task<(List<FineResponseDto> Items, long Total)> GetFinesAsync(string? userId, string? status, string? reason, int page, int limit)
        {
            var (items, total) = await _fineRepository.SearchAsync(userId, status, reason, page, limit);

            var dtos = new List<FineResponseDto>();
            foreach (var fine in items)
            {
                dtos.Add(await BuildFineResponseDtoAsync(fine));
            }

            return (dtos, total);
        }

        public async Task<FineResponseDto?> GetFineByIdAsync(string id)
        {
            var fine = await _fineRepository.GetByIdAsync(id);
            if (fine == null) return null;

            return await BuildFineResponseDtoAsync(fine);
        }

        public async Task<FineResponseDto> PayFineAsync(string fineId, PayFineDto dto)
        {
            var fine = await _fineRepository.GetByIdAsync(fineId);
            if (fine == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy phiếu phạt ID: {fineId}");
            }

            if (fine.Status == "PAID")
            {
                throw new InvalidOperationException("Khoản phạt này đã được thanh toán trước đó.");
            }

            if (fine.Status == "WAIVED")
            {
                throw new InvalidOperationException("Khoản phạt này đã được miễn giảm.");
            }

            fine.Status = "PAID";
            fine.PaidAt = DateTime.UtcNow;
            if (!string.IsNullOrEmpty(dto.Note))
            {
                fine.Note = (fine.Note ?? "") + $" | Ghi chú thanh toán: {dto.Note}";
            }

            await _fineRepository.UpdateAsync(fine.Id, fine);

            _logger.LogInformation("Successfully paid fine {FineId} amount {Amount}", fine.Id, fine.Amount);

            return await BuildFineResponseDtoAsync(fine);
        }

        public async Task<FineResponseDto> WaiveFineAsync(string fineId, WaiveFineDto dto, string actorUserId)
        {
            var fine = await _fineRepository.GetByIdAsync(fineId);
            if (fine == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy phiếu phạt ID: {fineId}");
            }

            if (fine.Status != "UNPAID")
            {
                throw new InvalidOperationException($"Chỉ có thể miễn giảm khoản phạt đang ở trạng thái UNPAID. Trạng thái hiện tại: {fine.Status}");
            }

            fine.Status = "WAIVED";
            fine.WaivedAt = DateTime.UtcNow;
            fine.WaivedBy = actorUserId;
            fine.Note = (fine.Note ?? "") + $" | Lý do miễn phạt: {dto.Reason}";

            await _fineRepository.UpdateAsync(fine.Id, fine);

            _logger.LogWarning("Waived fine {FineId} by user {ActorId}. Reason: {Reason}", fine.Id, actorUserId, dto.Reason);

            return await BuildFineResponseDtoAsync(fine);
        }

        #region Helper Mapping Methods

        private async Task<FineResponseDto> BuildFineResponseDtoAsync(Fine fine)
        {
            var user = await _usersCollection.Find(u => u.Id == fine.UserId).FirstOrDefaultAsync();
            var borrowing = await _borrowingRepository.GetByIdAsync(fine.BorrowingId);
            User? waivedByUser = null;
            if (!string.IsNullOrEmpty(fine.WaivedBy))
            {
                waivedByUser = await _usersCollection.Find(u => u.Id == fine.WaivedBy).FirstOrDefaultAsync();
            }

            return new FineResponseDto
            {
                Id = fine.Id,
                UserId = fine.UserId,
                UserName = user?.FullName,
                StudentCode = user?.StudentCode,
                BorrowingId = fine.BorrowingId,
                BorrowingCode = borrowing?.Code,
                BorrowingItemId = fine.BorrowingItemId,
                Amount = fine.Amount,
                Reason = fine.Reason,
                Status = fine.Status,
                CreatedAt = fine.CreatedAt,
                PaidAt = fine.PaidAt,
                WaivedAt = fine.WaivedAt,
                WaivedBy = fine.WaivedBy,
                WaivedByName = waivedByUser?.FullName,
                Note = fine.Note
            };
        }

        #endregion
    }
}
