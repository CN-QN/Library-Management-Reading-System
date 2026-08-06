using System.Security.Claims;
using api.Auth;
using api.Common.Constants;
using api.Common.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace api.Tests.Security;

public class AdminAuthorizationTests
{
    [Fact]
    public async Task RequirePermission_returns_401_when_user_is_not_authenticated()
    {
        var filter = new RequirePermissionAttribute(Permissions.SettingRead);
        var context = CreateAuthorizationContext(authenticated: false, userId: null, permissions: []);

        await filter.OnAuthorizationAsync(context);

        context.Result.Should().BeOfType<JsonResult>();
        var json = (JsonResult)context.Result!;
        var body = json.Value as ErrorResponse;
        body!.StatusCode.Should().Be(401);
    }

    [Fact]
    public async Task RequirePermission_returns_403_when_permission_is_missing()
    {
        var filter = new RequirePermissionAttribute(Permissions.ReviewModerate);
        var context = CreateAuthorizationContext(
            authenticated: true,
            userId: "user-without-perm",
            permissions: [Permissions.SettingRead]);

        await filter.OnAuthorizationAsync(context);

        context.Result.Should().BeOfType<JsonResult>();
        var json = (JsonResult)context.Result!;
        var body = json.Value as ErrorResponse;
        body!.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task RequirePermission_allows_request_when_permission_is_present()
    {
        var filter = new RequirePermissionAttribute(Permissions.FileManage);
        var context = CreateAuthorizationContext(
            authenticated: true,
            userId: "media-admin",
            permissions: [Permissions.FileManage, Permissions.SettingRead]);

        await filter.OnAuthorizationAsync(context);

        context.Result.Should().BeNull();
    }

    [Fact]
    public async Task RequireAnyPermission_uses_or_semantics()
    {
        var filter = new RequireAnyPermissionAttribute(Permissions.PaymentRead, Permissions.ReportView);

        var deniedContext = CreateAuthorizationContext(
            authenticated: true,
            userId: "student",
            permissions: [Permissions.BookRead]);
        await filter.OnAuthorizationAsync(deniedContext);
        deniedContext.Result.Should().BeOfType<JsonResult>();
        ((JsonResult)deniedContext.Result!).Value.Should().BeOfType<ErrorResponse>()
            .Which.StatusCode.Should().Be(403);

        var allowedByPayment = CreateAuthorizationContext(
            authenticated: true,
            userId: "finance",
            permissions: [Permissions.PaymentRead]);
        await filter.OnAuthorizationAsync(allowedByPayment);
        allowedByPayment.Result.Should().BeNull();

        var allowedByReport = CreateAuthorizationContext(
            authenticated: true,
            userId: "librarian",
            permissions: [Permissions.ReportView]);
        await filter.OnAuthorizationAsync(allowedByReport);
        allowedByReport.Result.Should().BeNull();
    }

    [Fact]
    public void Permission_seed_includes_admin_remediation_permissions()
    {
        var seededCodes = api.Database.Seed.PermissionSeed.Permissions.Select(p => p.Code).ToHashSet();

        seededCodes.Should().Contain(Permissions.PaymentRead);
        seededCodes.Should().Contain(Permissions.PromotionBannerManage);
        seededCodes.Should().Contain(Permissions.PromotionFlashSaleManage);
        seededCodes.Should().Contain(Permissions.PromotionVoucherManage);
        seededCodes.Should().Contain(Permissions.ReviewModerate);
        seededCodes.Should().Contain(Permissions.FileManage);
        seededCodes.Should().Contain(Permissions.NotificationBroadcast);
    }

    [Fact]
    public void Library_admin_role_includes_new_payment_and_promotion_permissions()
    {
        var adminPerms = api.Database.Seed.PermissionSeed.RolePermissionsMapping["LIBRARY_ADMIN"];

        adminPerms.Should().Contain(Permissions.PaymentRead);
        adminPerms.Should().Contain(Permissions.PromotionBannerManage);
        adminPerms.Should().Contain(Permissions.PromotionFlashSaleManage);
        adminPerms.Should().Contain(Permissions.PromotionVoucherManage);
    }

    private static AuthorizationFilterContext CreateAuthorizationContext(
        bool authenticated,
        string? userId,
        IEnumerable<string> permissions)
    {
        var claims = new List<Claim>();
        if (!string.IsNullOrEmpty(userId))
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        }

        var identity = authenticated
            ? new ClaimsIdentity(claims, "TestAuth")
            : new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = principal,
            RequestServices = BuildAuthServiceProvider(userId, permissions),
        };

        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        return new AuthorizationFilterContext(actionContext, []);
    }

    private static IServiceProvider BuildAuthServiceProvider(string? userId, IEnumerable<string> permissions)
    {
        var resolverMock = new Mock<IUserPermissionResolver>();
        if (!string.IsNullOrEmpty(userId))
        {
            resolverMock
                .Setup(s => s.GetCachedPermissionsAsync(userId))
                .ReturnsAsync(permissions.ToList());
        }

        var services = new ServiceCollection();
        services.AddSingleton(resolverMock.Object);
        return services.BuildServiceProvider();
    }
}
