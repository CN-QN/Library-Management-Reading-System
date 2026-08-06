using System.Text.RegularExpressions;
using api.Database;
using api.Database.Entities;
using api.Modules.Payment.DTOs;
using MongoDB.Driver;

namespace api.Modules.Payment.Services;

public class PaymentService : IPaymentService
{
    private readonly MongoDbContext _context;
    private readonly IRedisPaymentService _redisPaymentService;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        MongoDbContext context,
        IRedisPaymentService redisPaymentService,
        ILogger<PaymentService> logger)
    {
        _context = context;
        _redisPaymentService = redisPaymentService;
        _logger = logger;
    }

    public async Task<PaymentQrResponse> CreatePaymentQrAsync(string userId, string bookId)
    {
        var book = await _context.Books.Find(b => b.Id == bookId).FirstOrDefaultAsync();
        if (book == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy sách với ID: {bookId}");
        }

        // Tạo mã đơn hàng độc nhất dạng LH10293
        var randomNum = Random.Shared.Next(100000, 999999);
        var orderCode = $"LH{randomNum}";

        // Số tiền mặc định cho sách Premium (50,000 VNĐ)
        decimal amount = 50000;

        // Nội dung chuyển khoản chuẩn theo SePay
        var paymentContent = orderCode;

        // Sinh link mã VietQR động SePay chuẩn ngân hàng MBBank
        // Cú pháp SePay VietQR: https://qr.sepay.vn/img?acc=ACCOUNT&bank=BANK&amount=AMOUNT&des=CONTENT
        var bankAccount = "0987654321";
        var bankName = "MBBank";
        var qrCodeUrl = $"https://qr.sepay.vn/img?acc={bankAccount}&bank={bankName}&amount={(int)amount}&des={paymentContent}";

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

        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return false;
        }

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

    public async Task<PaymentQrResponse?> GetOrderStatusAsync(string orderCode)
    {
        var order = await _context.PaymentOrders.Find(o => o.OrderCode == orderCode).FirstOrDefaultAsync();
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
}
