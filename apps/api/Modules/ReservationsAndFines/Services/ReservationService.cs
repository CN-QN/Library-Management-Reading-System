using api.Database.Entities;
using api.Modules.ReservationsAndFines.DTOs;
using api.Repositories.Interfaces;
using MongoDB.Driver;

namespace api.Modules.ReservationsAndFines.Services
{
    public class ReservationService : IReservationService
    {
        private readonly IReservationRepository _reservationRepository;
        private readonly IBookRepository _bookRepository;
        private readonly ICopyRepository _copyRepository;
        private readonly IFineRepository _fineRepository;
        private readonly IMongoCollection<User> _usersCollection;
        private readonly IMongoCollection<LibraryBranch> _branchesCollection;
        private readonly ILogger<ReservationService> _logger;

        public ReservationService(
            IReservationRepository reservationRepository,
            IBookRepository bookRepository,
            ICopyRepository copyRepository,
            IFineRepository fineRepository,
            IMongoDatabase database,
            ILogger<ReservationService> logger)
        {
            _reservationRepository = reservationRepository;
            _bookRepository = bookRepository;
            _copyRepository = copyRepository;
            _fineRepository = fineRepository;
            _usersCollection = database.GetCollection<User>("users");
            _branchesCollection = database.GetCollection<LibraryBranch>("library_branches");
            _logger = logger;
        }

        public async Task<ReservationResponseDto> CreateReservationAsync(CreateReservationDto dto)
        {
            // 1. Verify user
            var user = await _usersCollection.Find(u => u.Id == dto.UserId).FirstOrDefaultAsync();
            if (user == null)
            {
                throw new KeyNotFoundException("Không tìm thấy người dùng.");
            }

            if (user.Status != "ACTIVE")
            {
                throw new InvalidOperationException("Tài khoản không ở trạng thái hoạt động.");
            }

            // 2. Check unpaid fines
            var unpaidFine = await _fineRepository.GetTotalUnpaidAmountByUserIdAsync(dto.UserId);
            if (unpaidFine > 0)
            {
                throw new InvalidOperationException($"Tài khoản đang có tiền phạt chưa thanh toán ({unpaidFine:N0} VNĐ). Vui lòng nộp phạt trước khi đặt trước.");
            }

            // 3. Verify book
            var book = await _bookRepository.GetByIdAsync(dto.BookId);
            if (book == null)
            {
                throw new KeyNotFoundException("Không tìm thấy sách yêu cầu đặt trước.");
            }

            // 4. Check existing active reservation for this book by this user
            var existing = await _reservationRepository.GetActiveByUserIdAndBookIdAsync(dto.UserId, dto.BookId);
            if (existing != null)
            {
                throw new InvalidOperationException("Bạn đã có lượt đặt trước sách này đang ở trạng thái chờ hoặc sẵn sàng.");
            }

            // 5. Kiểm tra bản sao sẵn có – chỉ cho phép đặt trước khi không còn bản sao nào
            var availableCopiesCount = await _copyRepository.CountAvailableByBookIdAsync(dto.BookId);
            if (availableCopiesCount > 0)
            {
                throw new InvalidOperationException(
                    $"Sách này hiện còn {availableCopiesCount} bản sao sẵn có tại thư viện. " +
                    "Vui lòng đến quầy mượn trực tiếp thay vì đặt trước.");
            }

            // 6. Tính vị trí hàng đợi (chỉ đến đây khi sách hết bản sao)
            var nextQueuePos = await _reservationRepository.GetNextQueuePositionAsync(dto.BookId);
            var status = "WAITING";
            DateTime? readyUntil = null;


            var reservation = new Reservation
            {
                UserId = dto.UserId,
                BookId = dto.BookId,
                BranchId = dto.BranchId,
                Status = status,
                QueuePosition = nextQueuePos,
                ReservedAt = DateTime.UtcNow,
                ReadyUntil = readyUntil,
                Note = dto.Note
            };

            await _reservationRepository.InsertAsync(reservation);
            _logger.LogInformation("Created reservation {Id} for user {UserId} on book {BookId}", reservation.Id, dto.UserId, dto.BookId);

            return await BuildReservationResponseDtoAsync(reservation);
        }

        public async Task<ReservationResponseDto> CancelReservationAsync(string reservationId, string userId)
        {
            var reservation = await _reservationRepository.GetByIdAsync(reservationId);
            if (reservation == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy lượt đặt trước ID: {reservationId}");
            }

            if (reservation.Status != "WAITING" && reservation.Status != "READY")
            {
                throw new InvalidOperationException($"Không thể hủy lượt đặt trước đã ở trạng thái {reservation.Status}.");
            }

            reservation.Status = "CANCELLED";
            reservation.CancelledAt = DateTime.UtcNow;

            await _reservationRepository.UpdateAsync(reservation.Id, reservation);

            // Update remaining queue positions
            await _reservationRepository.UpdateQueuePositionsAsync(reservation.BookId);

            _logger.LogInformation("Cancelled reservation {Id} for book {BookId}", reservation.Id, reservation.BookId);

            return await BuildReservationResponseDtoAsync(reservation);
        }

        public async Task<ReservationResponseDto> FulfillReservationAsync(string reservationId)
        {
            var reservation = await _reservationRepository.GetByIdAsync(reservationId);
            if (reservation == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy lượt đặt trước ID: {reservationId}");
            }

            if (reservation.Status != "READY" && reservation.Status != "WAITING")
            {
                throw new InvalidOperationException($"Chỉ có thể hoàn thành lượt đặt trước đang ở trạng thái READY hoặc WAITING.");
            }

            reservation.Status = "FULFILLED";
            reservation.FulfilledAt = DateTime.UtcNow;

            await _reservationRepository.UpdateAsync(reservation.Id, reservation);

            // Update remaining queue positions
            await _reservationRepository.UpdateQueuePositionsAsync(reservation.BookId);

            _logger.LogInformation("Fulfilled reservation {Id} for book {BookId}", reservation.Id, reservation.BookId);

            return await BuildReservationResponseDtoAsync(reservation);
        }

        public async Task<(List<ReservationResponseDto> Items, long Total)> GetReservationsAsync(string? userId, string? bookId, string? branchId, string? status, int page, int limit)
        {
            var (items, total) = await _reservationRepository.SearchAsync(userId, bookId, branchId, status, page, limit);

            var dtos = new List<ReservationResponseDto>();
            foreach (var res in items)
            {
                dtos.Add(await BuildReservationResponseDtoAsync(res));
            }

            return (dtos, total);
        }

        public async Task<ReservationResponseDto?> GetReservationByIdAsync(string id)
        {
            var reservation = await _reservationRepository.GetByIdAsync(id);
            if (reservation == null) return null;

            return await BuildReservationResponseDtoAsync(reservation);
        }

        public async Task CheckAndProcessExpiredReservationsAsync()
        {
            var expiredList = await _reservationRepository.GetExpiredReadyReservationsAsync();
            foreach (var res in expiredList)
            {
                res.Status = "EXPIRED";
                await _reservationRepository.UpdateAsync(res.Id, res);
                await _reservationRepository.UpdateQueuePositionsAsync(res.BookId);
                _logger.LogWarning("Expired ready reservation {Id} for book {BookId}", res.Id, res.BookId);
            }
        }

        #region Helper Mapping Methods

        private async Task<ReservationResponseDto> BuildReservationResponseDtoAsync(Reservation reservation)
        {
            var user = await _usersCollection.Find(u => u.Id == reservation.UserId).FirstOrDefaultAsync();
            var book = await _bookRepository.GetByIdAsync(reservation.BookId);
            var branch = await _branchesCollection.Find(b => b.Id == reservation.BranchId).FirstOrDefaultAsync();

            return new ReservationResponseDto
            {
                Id = reservation.Id,
                UserId = reservation.UserId,
                UserName = user?.FullName,
                StudentCode = user?.StudentCode,
                BookId = reservation.BookId,
                BookTitle = book?.Title,
                BranchId = reservation.BranchId,
                BranchName = branch?.Name,
                Status = reservation.Status,
                QueuePosition = reservation.QueuePosition,
                ReservedAt = reservation.ReservedAt,
                ReadyUntil = reservation.ReadyUntil,
                FulfilledAt = reservation.FulfilledAt,
                CancelledAt = reservation.CancelledAt,
                Note = reservation.Note
            };
        }

        #endregion
    }
}
