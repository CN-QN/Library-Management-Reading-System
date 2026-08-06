using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Database;
using api.Database.Entities;
using api.Modules.Payment.DTOs;
using api.Modules.Payment.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace api.Modules.Admin;

[ApiController, Route("api/admin/reports"), RequirePermission(Permissions.ReportView)]
public sealed class AdminReportsController : ControllerBase
{
    private readonly MongoDbContext _context; private readonly IPaymentService _payments;
    public AdminReportsController(MongoDbContext context, IPaymentService payments) { _context = context; _payments = payments; }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow; var from = now.Date.AddDays(-13);
        var totalBooksTask = _context.Books.CountDocumentsAsync(Builders<Book>.Filter.Empty, cancellationToken: cancellationToken);
        var totalUsersTask = _context.Users.CountDocumentsAsync(Builders<User>.Filter.Empty, cancellationToken: cancellationToken);
        var activeTask = _context.Borrowings.CountDocumentsAsync(x => x.Status == "OPEN" || x.Status == "OVERDUE", cancellationToken: cancellationToken);
        var overdueTask = _context.Borrowings.CountDocumentsAsync(x => (x.Status == "OPEN" || x.Status == "OVERDUE") && x.ExpectedReturnAt < now, cancellationToken: cancellationToken);
        var borrowingsTask = _context.Borrowings.Find(x => x.BorrowedAt >= from).ToListAsync(cancellationToken);
        var trendingTask = _context.Books.Find(x => x.Status == "PUBLISHED").SortByDescending(x => x.Stats.ReadingCount).Limit(5).ToListAsync(cancellationToken);
        var recentTask = _context.Books.Find(Builders<Book>.Filter.Empty).SortByDescending(x => x.CreatedAt).Limit(5).ToListAsync(cancellationToken);
        await Task.WhenAll(totalBooksTask, totalUsersTask, activeTask, overdueTask, borrowingsTask, trendingTask, recentTask);
        var trend = Enumerable.Range(0, 14).Select(offset => from.AddDays(offset)).Select(day => new BorrowingTrendPoint(day.ToString("yyyy-MM-dd"), borrowingsTask.Result.Count(x => x.BorrowedAt.Date == day.Date), borrowingsTask.Result.Count(x => x.ClosedAt?.Date == day.Date))).ToList();
        var result = new DashboardReport(new DashboardCards(new(totalBooksTask.Result), new(totalUsersTask.Result), new(activeTask.Result), new(overdueTask.Result)), trendingTask.Result, recentTask.Result, trend);
        return Ok(ApiResponse<DashboardReport>.SuccessResponse(result));
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> Revenue() => Ok(ApiResponse<RevenueStatsResponse>.SuccessResponse(await _payments.GetRevenueStatsAsync()));

    [HttpGet("borrowing-trend")]
    public async Task<IActionResult> BorrowingTrend([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var end = (to ?? DateTime.UtcNow).Date; var start = (from ?? end.AddDays(-13)).Date; if (start > end || (end - start).TotalDays > 366) return BadRequest(ApiResponse.ErrorResponse(400, "Khoảng ngày không hợp lệ."));
        var values = await _context.Borrowings.Find(x => x.BorrowedAt >= start && x.BorrowedAt < end.AddDays(1)).ToListAsync();
        var result = Enumerable.Range(0, (end - start).Days + 1).Select(i => start.AddDays(i)).Select(day => new BorrowingTrendPoint(day.ToString("yyyy-MM-dd"), values.Count(x => x.BorrowedAt.Date == day), values.Count(x => x.ClosedAt?.Date == day))).ToList();
        return Ok(ApiResponse<List<BorrowingTrendPoint>>.SuccessResponse(result));
    }

    [HttpGet("status-breakdowns")]
    public async Task<IActionResult> Breakdowns()
    {
        var books = await _context.Books.Find(Builders<Book>.Filter.Empty).Project(x => x.Status).ToListAsync();
        var users = await _context.Users.Find(Builders<User>.Filter.Empty).Project(x => x.Status).ToListAsync();
        var loans = await _context.Borrowings.Find(Builders<Borrowing>.Filter.Empty).Project(x => x.Status).ToListAsync();
        var fines = await _context.Fines.Find(Builders<Fine>.Filter.Empty).ToListAsync();
        var result = new StatusBreakdowns(Group(books), Group(users), Group(loans), fines.GroupBy(x => x.Status).Select(x => new FineStatusCount(x.Key, x.Count(), x.Sum(v => v.Amount))).ToList());
        return Ok(ApiResponse<StatusBreakdowns>.SuccessResponse(result));
    }
    private static List<StatusCount> Group(IEnumerable<string> values) => values.GroupBy(x => x).Select(x => new StatusCount(x.Key, x.LongCount())).OrderBy(x => x.Status).ToList();
}

public sealed record StatCard(long Value);
public sealed record DashboardCards(StatCard TotalBooks, StatCard TotalUsers, StatCard ActiveBorrowings, StatCard OverdueBorrowings);
public sealed record BorrowingTrendPoint(string Date, int BorrowCount, int ReturnCount);
public sealed record DashboardReport(DashboardCards StatCards, List<Book> TrendingBooks, List<Book> RecentBooks, List<BorrowingTrendPoint> BorrowingTrend);
public sealed record StatusCount(string Status, long Count);
public sealed record FineStatusCount(string Status, int Count, decimal TotalAmount);
public sealed record StatusBreakdowns(List<StatusCount> BookStatusBreakdown, List<StatusCount> UserStatusBreakdown, List<StatusCount> BorrowingStatusBreakdown, List<FineStatusCount> FineSummary);
