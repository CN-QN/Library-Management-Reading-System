using System.Security.Claims;
using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using api.Database;
using api.Database.Entities;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace api.Modules.Admin;

[ApiController, Route("api/admin/email-campaigns"), RequirePermission(Permissions.NotificationBroadcast)]
public sealed class AdminEmailCampaignsController : ControllerBase
{
    private readonly MongoDbContext _context;
    private readonly IEmailSender _email;
    public AdminEmailCampaignsController(MongoDbContext context, IEmailSender email) { _context = context; _email = email; }

    [HttpGet]
    public async Task<IActionResult> List() => Ok(ApiResponse<List<EmailCampaign>>.SuccessResponse(
        await _context.EmailCampaigns.Find(Builders<EmailCampaign>.Filter.Empty).SortByDescending(x => x.CreatedAt).ToListAsync()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmailCampaignRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.Body))
            return BadRequest(ApiResponse.ErrorResponse(400, "Tiêu đề và nội dung là bắt buộc."));
        var campaign = new EmailCampaign { Subject = request.Subject.Trim(), Body = request.Body, CampaignType = request.CampaignType.Trim().ToUpperInvariant(), CreatedBy = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty };
        await _context.EmailCampaigns.InsertOneAsync(campaign);
        return Ok(ApiResponse<EmailCampaign>.SuccessResponse(campaign));
    }

    [HttpPost("{id}/send")]
    public async Task<IActionResult> Send(string id, CancellationToken cancellationToken)
    {
        var claimFilter = Builders<EmailCampaign>.Filter.And(
            Builders<EmailCampaign>.Filter.Eq(x => x.Id, id),
            Builders<EmailCampaign>.Filter.Ne(x => x.Status, "SENT"),
            Builders<EmailCampaign>.Filter.Ne(x => x.Status, "SENDING"));
        var campaign = await _context.EmailCampaigns.FindOneAndUpdateAsync<EmailCampaign>(
            claimFilter,
            Builders<EmailCampaign>.Update.Set(x => x.Status, "SENDING"),
            new FindOneAndUpdateOptions<EmailCampaign, EmailCampaign> { ReturnDocument = ReturnDocument.After }, cancellationToken);
        if (campaign is null)
        {
            var exists = await _context.EmailCampaigns.Find(x => x.Id == id).AnyAsync(cancellationToken);
            return exists ? Conflict(ApiResponse.ErrorResponse(409, "Chiến dịch đã hoặc đang được gửi.")) : NotFound(ApiResponse.ErrorResponse(404, "Không tìm thấy chiến dịch."));
        }
        var recipients = (await _context.Users.Find(x => x.NotifyBookAvailable && x.Status == "ACTIVE")
                .Project(x => x.Email).ToListAsync(cancellationToken))
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var sent = 0; var failed = 0;
        foreach (var recipient in recipients)
        {
            try { await _email.SendAsync(recipient, campaign.Subject, campaign.Body, cancellationToken); sent++; }
            catch { failed++; }
        }
        campaign.RecipientCount = recipients.Length; campaign.SentCount = sent; campaign.FailedCount = failed;
        campaign.Status = failed == 0 ? "SENT" : sent == 0 ? "FAILED" : "PARTIALLY_SENT";
        campaign.FailureSummary = failed > 0 ? $"{failed} email(s) failed." : null; campaign.SentAt = DateTime.UtcNow;
        await _context.EmailCampaigns.ReplaceOneAsync(x => x.Id == id, campaign, cancellationToken: cancellationToken);
        return Ok(ApiResponse<EmailCampaign>.SuccessResponse(campaign));
    }
}

public sealed record CreateEmailCampaignRequest(string Subject, string Body, string CampaignType);
