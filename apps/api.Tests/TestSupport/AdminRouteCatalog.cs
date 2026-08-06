namespace api.Tests.TestSupport;

using api.Common.Constants;

/// <summary>
/// Target admin route contract from the remediation plan.
/// Tests assert these routes exist with the expected permission guards.
/// </summary>
public static class AdminRouteCatalog
{
    public sealed record AdminEndpoint(
        string Method,
        string RouteTemplate,
        string[] RequiredPermissions,
        bool AcceptAnyPermission = false);

    public static IReadOnlyList<AdminEndpoint> TargetEndpoints { get; } = new List<AdminEndpoint>
    {
        new("GET", "/api/admin/payments/orders", [Permissions.PaymentRead, Permissions.ReportView], AcceptAnyPermission: true),
        new("GET", "/api/admin/payments/revenue-summary", [Permissions.PaymentRead, Permissions.ReportView], AcceptAnyPermission: true),
        new("GET", "/api/admin/reviews", [Permissions.ReviewModerate]),
        new("PATCH", "/api/admin/reviews/{id}/status", [Permissions.ReviewModerate]),
        new("DELETE", "/api/admin/reviews/{id}", [Permissions.ReviewModerate]),
        new("GET", "/api/admin/reports/dashboard", [Permissions.ReportView]),
        new("GET", "/api/admin/reports/revenue", [Permissions.ReportView]),
        new("GET", "/api/admin/reports/borrowing-trend", [Permissions.ReportView]),
        new("GET", "/api/admin/settings", [Permissions.SettingRead]),
        new("PUT", "/api/admin/settings", [Permissions.SettingUpdate]),
        new("GET", "/api/admin/roles", [Permissions.RoleRead]),
        new("POST", "/api/admin/roles", [Permissions.RoleCreate]),
        new("PUT", "/api/admin/roles/{id}", [Permissions.RoleUpdate]),
        new("GET", "/api/admin/email-campaigns", [Permissions.NotificationBroadcast]),
        new("POST", "/api/admin/email-campaigns", [Permissions.NotificationBroadcast]),
        new("POST", "/api/admin/email-campaigns/{id}/send", [Permissions.NotificationBroadcast]),
        new("POST", "/api/admin/media/upload", [Permissions.FileManage]),
        new("GET", "/api/admin/media", [Permissions.FileManage]),
        new("DELETE", "/api/admin/media/{id}", [Permissions.FileManage]),
        new("GET", "/api/admin/banners", [Permissions.PromotionBannerManage]),
        new("POST", "/api/admin/banners", [Permissions.PromotionBannerManage]),
        new("PUT", "/api/admin/banners/{id}", [Permissions.PromotionBannerManage]),
        new("DELETE", "/api/admin/banners/{id}", [Permissions.PromotionBannerManage]),
        new("GET", "/api/admin/flash-sales", [Permissions.PromotionFlashSaleManage]),
        new("POST", "/api/admin/flash-sales", [Permissions.PromotionFlashSaleManage]),
        new("GET", "/api/admin/vouchers", [Permissions.PromotionVoucherManage]),
        new("POST", "/api/admin/vouchers", [Permissions.PromotionVoucherManage]),
    };

    public static IReadOnlyList<string> LegacyInsecureRoutes { get; } =
    [
        "POST /api/notifications/email-broadcast",
        "GET /api/payments/admin/all-orders",
        "GET /api/payments/admin/revenue-stats",
        "GET /api/media/config",
        "POST /api/media/upload",
        "POST /api/media/delete-cloudinary",
    ];

    public static IReadOnlyList<string> PublicReaderRoutes { get; } =
    [
        "GET /api/Banners",
        "GET /api/FlashSale",
        "POST /api/auth/forgot-password",
        "POST /api/auth/reset-password",
        "POST /api/auth/google",
    ];
}
