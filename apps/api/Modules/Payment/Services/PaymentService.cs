using System.Text.RegularExpressions;
using api.Configuration;
using api.Database;
using api.Database.Entities;
using api.Modules.Payment.DTOs;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace api.Modules.Payment.Services;

public class PaymentService : IPaymentService
{
    private readonly MongoDbContext _context;
    private readonly IRedisPaymentService _redisPaymentService;
    private readonly ILogger<PaymentService> _logger;

    private readonly SePaySettings _sePaySettings;

    public PaymentService(
        MongoDbContext context,
        IRedisPaymentService redisPaymentService,
        IOptions<SePaySettings> sePayOptions,
        ILogger<PaymentService> logger)
    {
        _context = context;
        _redisPaymentService = redisPaymentService;
        _sePaySettings = sePayOptions.Value;
        _logger = logger;
    }

    public async Task<PaymentQrResponse> CreatePaymentQrAsync(string userId, string bookId)
    {
         var book = await _context.Books
        .Find(b => b.Id == bookId && b.Status == "PUBLISHED")
        .FirstOrDefaultAsync();
            if (book == null)
    {
        throw new KeyNotFoundException("Sách không tồn tại hoặc chưa được xuất bản.");
    }

        // Tạo mã đơn hàng độc nhất dạng LH10293
        var randomNum = Random.Shared.Next(100000, 999999);
        var orderCode = $"LH{randomNum}";
       // 1. Chỉ cho phép tìm sách ĐÃ XUẤT BẢN (Status == "PUBLISHED")
   

    // 2. Nếu là sách MIỄN PHÍ thì không cho tạo mã QR thanh toán!
    if (string.Equals(book.AccessType, "FREE", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("Đây là sách miễn phí, bạn có thể đọc ngay mà không cần thanh toán.");
    }
    
    // 4. Lấy ĐÚNG 100% giá bán của sách
    decimal amount = book.Price;

        // Nội dung chuyển khoản chuẩn theo SePay

        // VietinBank yêu cầu nội dung bắt đầu bằng SEVQR
        var paymentContent = $"SEVQR {orderCode}";
        // Sinh link mã VietQR động SePay chuẩn từ cấu hình appsettings.json
        var storedSettings = await _context.SystemSettings.Find(x => x.Scope == "SEPAY").ToListAsync();
        var bankAccount = storedSettings.FirstOrDefault(x => x.Key == "SEPAY_BANK_ACCOUNT")?.Value ?? _sePaySettings.BankAccount;
        var bankName = storedSettings.FirstOrDefault(x => x.Key == "SEPAY_BANK_NAME")?.Value ?? _sePaySettings.BankName;
        if (string.IsNullOrWhiteSpace(bankAccount) || string.IsNullOrWhiteSpace(bankName))
            throw new InvalidOperationException("SePay payment settings are not configured.");
        var encodedPaymentContent = Uri.EscapeDataString(paymentContent);
        var qrCodeUrl = $"https://qr.sepay.vn/img?acc={bankAccount}&bank={bankName}&amount={(int)amount}&des={encodedPaymentContent}";

        var paymentOrder = new PaymentOrder
        {
            OrderCode = orderCode,
            UserId = userId,
            BookId = bookId,
            BookTitle = book.Title,
            Amount = amount,
            Status = "PENDING",
            QrCodeUrl = qrCodeUrl,
            PaymentContent = paymentContent,
            CreatedAt = DateTime.UtcNow
        };

        await _context.PaymentOrders.InsertOneAsync(paymentOrder);

        return new PaymentQrResponse
        {
            OrderCode = orderCode,
            QrCodeUrl = qrCodeUrl,
            Amount = amount,
            PaymentContent = paymentContent,
            BookId = bookId,
            BookTitle = book.Title,
            Status = "PENDING"
        };
    }

    public async Task<bool> ProcessSePayWebhookAsync(SePayWebhookDto dto)
    {
        _logger.LogInformation("Processing SePay Webhook: Content='{Content}', Amount={Amount}, Gateway='{Gateway}'",
            dto.Content, dto.TransferAmount, dto.Gateway);

        // Tìm mã đơn hàng dạng LHxxxxxx trong nội dung chuyển khoản
        var match = Regex.Match(dto.Content, @"LH\d{6}", RegexOptions.IgnoreCase);
        if (!match.Success)
        {
            _logger.LogWarning("SePay Webhook content '{Content}' does not match pattern LHxxxxxx", dto.Content);
            return false;
        }

        var orderCode = match.Value.ToUpper();
        var order = await _context.PaymentOrders.Find(o => o.OrderCode == orderCode).FirstOrDefaultAsync();

        if (order == null)
        {
            _logger.LogWarning("PaymentOrder with code '{OrderCode}' not found", orderCode);
            return false;
        }

        if (order.Status == "SUCCESS")
        {
            _logger.LogInformation("PaymentOrder '{OrderCode}' already marked as SUCCESS", orderCode);
            return true;
        }

        // Cập nhật đơn hàng sang SUCCESS
        var update = Builders<PaymentOrder>.Update
            .Set(o => o.Status, "SUCCESS")
            .Set(o => o.PaidAt, DateTime.UtcNow)
            .Set(o => o.SePayTransactionId, dto.Id.ToString());

        await _context.PaymentOrders.UpdateOneAsync(o => o.Id == order.Id, update);

        // Cấp quyền đọc sách cho User (UserBookAccess)
        var accessFilter = Builders<UserBookAccess>.Filter.Where(a => a.UserId == order.UserId && a.BookId == order.BookId);
        var existingAccess = await _context.UserBookAccesses.Find(accessFilter).FirstOrDefaultAsync();

        if (existingAccess == null)
        {
            var userAccess = new UserBookAccess
            {
                UserId = order.UserId,
                BookId = order.BookId,
                PaymentOrderId = order.Id,
                GrantedAt = DateTime.UtcNow
            };
            await _context.UserBookAccesses.InsertOneAsync(userAccess);
        }

        // Phát sự kiện Pub/Sub qua Redis & SignalR về cho Frontend
        var payload = new
        {
            orderCode = order.OrderCode,
            bookId = order.BookId,
            userId = order.UserId,
            status = "SUCCESS",
            paidAt = DateTime.UtcNow
        };

        await _redisPaymentService.PublishPaymentSuccessAsync(order.OrderCode, payload);

        return true;
    }

    public async Task<bool> CheckBookAccessAsync(string userId, string bookId)
    {
        var book = await _context.Books.Find(b => b.Id == bookId).FirstOrDefaultAsync();
        if (book == null) return false;

        // Nếu là sách FREE thì tất cả user đều có quyền đọc
        if (string.Equals(book.AccessType, "FREE", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Nếu là sách PREMIUM / PAID -> kiểm tra bảng UserBookAccess
        var hasAccess = await _context.UserBookAccesses
            .Find(a => a.UserId == userId && a.BookId == bookId)
            .AnyAsync();

        return hasAccess;
    }

    public async Task<PaymentQrResponse?> GetOrderStatusAsync(string userId, string orderCode)
    {
        var order = await _context.PaymentOrders.Find(o => o.UserId == userId && o.OrderCode == orderCode).FirstOrDefaultAsync();
        if (order == null) return null;

        return new PaymentQrResponse
        {
            OrderCode = order.OrderCode,
            QrCodeUrl = order.QrCodeUrl,
            Amount = order.Amount,
            PaymentContent = order.PaymentContent,
            BookId = order.BookId,
            BookTitle = order.BookTitle,
            Status = order.Status
        };
    }

    public async Task<List<PaymentQrResponse>> GetMyOrdersAsync(string userId)
    {
        var orders = await _context.PaymentOrders
            .Find(o => o.UserId == userId)
            .SortByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(order => new PaymentQrResponse
        {
            OrderCode = order.OrderCode,
            QrCodeUrl = order.QrCodeUrl,
            Amount = order.Amount,
            PaymentContent = order.PaymentContent,
            BookId = order.BookId,
            BookTitle = order.BookTitle,
            Status = order.Status
        }).ToList();
    }

    public async Task<List<PaymentQrResponse>> GetAllOrdersAsync()
    {
        var orders = await _context.PaymentOrders
            .Find(Builders<PaymentOrder>.Filter.Empty)
            .SortByDescending(o => o.CreatedAt)
            .Limit(100)
            .ToListAsync();

        return orders.Select(order => new PaymentQrResponse
        {
            OrderCode = order.OrderCode,
            QrCodeUrl = order.QrCodeUrl,
            Amount = order.Amount,
            PaymentContent = order.PaymentContent,
            BookId = order.BookId,
            BookTitle = order.BookTitle,
            Status = order.Status,
            UserId = order.UserId,
            CreatedAt = order.CreatedAt,
            PaidAt = order.PaidAt
        }).ToList();
    }

    public async Task<RevenueStatsResponse> GetRevenueStatsAsync()
    {
        var allOrders = await _context.PaymentOrders
            .Find(Builders<PaymentOrder>.Filter.Empty)
            .ToListAsync();

        var successOrders = allOrders.Where(o => o.Status == "SUCCESS").ToList();
        var today = DateTime.UtcNow.Date;
        var todayOrders = successOrders.Where(o => o.PaidAt.HasValue && o.PaidAt.Value.Date == today).ToList();

        return new RevenueStatsResponse
        {
            TotalRevenue = successOrders.Sum(o => o.Amount),
            TodayRevenue = todayOrders.Sum(o => o.Amount),
            SuccessOrdersCount = successOrders.Count,
            PendingOrdersCount = allOrders.Count(o => o.Status == "PENDING"),
            TotalOrdersCount = allOrders.Count
        };
    }
}
