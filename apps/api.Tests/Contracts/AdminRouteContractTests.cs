using api.Tests.TestSupport;
using FluentAssertions;
using Xunit;

namespace api.Tests.Contracts;

public class AdminRouteContractTests
{
    [Fact]
    public void Legacy_email_broadcast_must_not_be_anonymous()
    {
        var endpoints = EndpointReflectionHelper.DiscoverApiEndpoints();
        var emailBroadcast = endpoints.FirstOrDefault(e =>
            e.HttpMethod == "POST"
            && e.RouteTemplate.Contains("notifications", StringComparison.OrdinalIgnoreCase)
            && e.RouteTemplate.Contains("email-broadcast", StringComparison.OrdinalIgnoreCase));

        if (emailBroadcast is not null)
        {
            emailBroadcast.AllowAnonymous.Should().BeFalse(
                "POST /api/notifications/email-broadcast must not be AllowAnonymous during migration");
        }
    }

    [Fact]
    public void Legacy_payment_admin_routes_must_require_authorization()
    {
        var endpoints = EndpointReflectionHelper.DiscoverApiEndpoints();

        var allOrders = endpoints.FirstOrDefault(e =>
            e.HttpMethod == "GET" && e.RouteTemplate.Contains("payments", StringComparison.OrdinalIgnoreCase)
            && e.RouteTemplate.Contains("admin", StringComparison.OrdinalIgnoreCase)
            && e.RouteTemplate.Contains("orders", StringComparison.OrdinalIgnoreCase));

        var revenueStats = endpoints.FirstOrDefault(e =>
            e.HttpMethod == "GET" && e.RouteTemplate.Contains("payments", StringComparison.OrdinalIgnoreCase)
            && e.RouteTemplate.Contains("revenue", StringComparison.OrdinalIgnoreCase));

        if (allOrders != null)
        {
            allOrders.RequiresAuth.Should().BeTrue("legacy payment admin orders route must require auth until migrated to /api/admin/payments/orders");
            allOrders.RequirePermissionCodes.Should().NotBeEmpty("payment admin orders must be guarded by payment.read or report.view");
        }

        if (revenueStats != null)
        {
            revenueStats.RequiresAuth.Should().BeTrue("legacy payment revenue route must require auth until migrated");
            revenueStats.RequirePermissionCodes.Should().NotBeEmpty("payment revenue must be guarded by payment.read or report.view");
        }
    }

    [Fact]
    public void Legacy_media_routes_must_not_expose_public_upload_or_config()
    {
        var endpoints = EndpointReflectionHelper.DiscoverApiEndpoints();
        var mediaEndpoints = endpoints.Where(e => e.RouteTemplate.Contains("/api/media", StringComparison.OrdinalIgnoreCase)).ToList();

        foreach (var endpoint in mediaEndpoints)
        {
            endpoint.AllowAnonymous.Should().BeFalse(
                $"media route {EndpointReflectionHelper.FormatEndpoint(endpoint.HttpMethod, endpoint.RouteTemplate)} must not be anonymous");
        }
    }

    [Theory]
    [MemberData(nameof(TargetAdminRoutes))]
    public void Target_admin_routes_must_exist_with_permissions(string method, string routeTemplate, string[] permissions, bool acceptAnyPermission)
    {
        var endpoints = DiscoverResolvedEndpoints();
        var match = endpoints.FirstOrDefault(e =>
            e.HttpMethod.Equals(method, StringComparison.OrdinalIgnoreCase)
            && RouteMatches(e.RouteTemplate, routeTemplate));

        match.Should().NotBeNull($"target route {method} {routeTemplate} must exist under api/admin namespace");
        match!.AllowAnonymous.Should().BeFalse();

        if (acceptAnyPermission)
        {
            match.RequireAnyPermission.Should().BeTrue();
            match.RequirePermissionCodes.Should().BeEquivalentTo(permissions);
        }
        else
        {
            match.RequirePermissionCodes.Should().BeEquivalentTo(permissions);
        }
    }

    [Theory]
    [MemberData(nameof(PublicReaderRoutes))]
    public void Public_reader_routes_remain_callable_without_admin_permission(string method, string routeTemplate)
    {
        var endpoints = DiscoverResolvedEndpoints();
        var match = endpoints.FirstOrDefault(e =>
            e.HttpMethod.Equals(method, StringComparison.OrdinalIgnoreCase)
            && RouteMatches(e.RouteTemplate, routeTemplate));

        match.Should().NotBeNull($"public/reader route {method} {routeTemplate} should remain available");
        match!.RequirePermissionCodes.Should().NotContain(p =>
            p.StartsWith("promotion.", StringComparison.Ordinal) && p.EndsWith("_manage", StringComparison.Ordinal));
    }

    private static List<DiscoveredEndpoint> DiscoverResolvedEndpoints()
    {
        var assembly = typeof(Program).Assembly;
        var controllerTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && typeof(Microsoft.AspNetCore.Mvc.ControllerBase).IsAssignableFrom(t))
            .ToDictionary(t => t.Name, t => t);

        return EndpointReflectionHelper.DiscoverApiEndpoints()
            .Select(e =>
            {
                if (!controllerTypes.TryGetValue(e.ControllerName, out var controllerType))
                {
                    return e;
                }

                return e with
                {
                    RouteTemplate = EndpointReflectionHelper.ResolveRouteTemplate(e, controllerType),
                };
            })
            .ToList();
    }

    public static IEnumerable<object[]> TargetAdminRoutes()
    {
        foreach (var endpoint in AdminRouteCatalog.TargetEndpoints)
        {
            yield return new object[] { endpoint.Method, endpoint.RouteTemplate, endpoint.RequiredPermissions, endpoint.AcceptAnyPermission };
        }
    }

    public static IEnumerable<object[]> PublicReaderRoutes()
    {
        foreach (var route in AdminRouteCatalog.PublicReaderRoutes)
        {
            var parts = route.Split(' ', 2);
            yield return new object[] { parts[0], parts[1] };
        }
    }

    private static bool RouteMatches(string actual, string expected)
    {
        var normalizedActual = actual.TrimEnd('/').ToLowerInvariant();
        var normalizedExpected = expected.TrimEnd('/').ToLowerInvariant();
        return normalizedActual == normalizedExpected;
    }
}
