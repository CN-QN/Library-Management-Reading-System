namespace api.Modules.ReservationsAndFines.Services
{
    /// <summary>
    /// Background worker chạy định kỳ 30 phút, tự động chuyển các lượt đặt trước
    /// đã quá 48 giờ sang trạng thái EXPIRED và cập nhật lại vị trí hàng đợi.
    /// </summary>
    public class ReservationExpiryWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ReservationExpiryWorker> _logger;
        private static readonly TimeSpan _interval = TimeSpan.FromMinutes(30);

        public ReservationExpiryWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<ReservationExpiryWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ReservationExpiryWorker started. Interval: {Interval} minutes.", _interval.TotalMinutes);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await RunJobAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi chạy job xử lý đặt trước hết hạn.");
                }

                await Task.Delay(_interval, stoppingToken);
            }

            _logger.LogInformation("ReservationExpiryWorker stopped.");
        }

        private async Task RunJobAsync()
        {
            _logger.LogInformation("Đang kiểm tra các lượt đặt trước hết hạn...");

            // Dùng scope mới vì IReservationService là Scoped, còn BackgroundService là Singleton
            using var scope = _scopeFactory.CreateScope();
            var reservationService = scope.ServiceProvider.GetRequiredService<IReservationService>();

            await reservationService.CheckAndProcessExpiredReservationsAsync();

            _logger.LogInformation("Hoàn tất kiểm tra đặt trước hết hạn.");
        }
    }
}
