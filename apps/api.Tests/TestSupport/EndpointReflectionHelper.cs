using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace api.Tests.TestSupport;

public sealed record DiscoveredEndpoint(
    string HttpMethod,
    string RouteTemplate,
    bool AllowAnonymous,
    bool RequiresAuth,
    string[] RequirePermissionCodes,
    bool RequireAnyPermission,
    string ControllerName,
    string ActionName);

public static class EndpointReflectionHelper
{
    public static IReadOnlyList<DiscoveredEndpoint> DiscoverApiEndpoints()
    {
        var assembly = typeof(Program).Assembly;
        var controllerTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && typeof(ControllerBase).IsAssignableFrom(t));

        var endpoints = new List<DiscoveredEndpoint>();

        foreach (var controller in controllerTypes)
        {
            var controllerRoute = controller.GetCustomAttribute<RouteAttribute>()?.Template ?? "";
            var controllerAuthorize = controller.GetCustomAttribute<AuthorizeAttribute>() != null;

            foreach (var method in controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly))
            {
                var httpMethods = ResolveHttpMethods(method);
                if (httpMethods.Count == 0) continue;

                var methodRoute = method.GetCustomAttributes(inherit: true)
                    .OfType<IRouteTemplateProvider>()
                    .Select(a => a.Template)
                    .FirstOrDefault(template => template is not null);

                var routeTemplate = CombineRoutes(controllerRoute, methodRoute);
                var allowAnonymous = method.GetCustomAttribute<AllowAnonymousAttribute>() != null
                    || controller.GetCustomAttribute<AllowAnonymousAttribute>() != null;

                var requirePermAttr = method.GetCustomAttribute<api.Auth.RequirePermissionAttribute>()
                    ?? controller.GetCustomAttribute<api.Auth.RequirePermissionAttribute>();
                var requireAnyAttr = method.GetCustomAttribute<api.Auth.RequireAnyPermissionAttribute>()
                    ?? controller.GetCustomAttribute<api.Auth.RequireAnyPermissionAttribute>();

                var permCodes = requirePermAttr?.Permissions
                    ?? requireAnyAttr?.Permissions
                    ?? Array.Empty<string>();

                var requiresAuth = controllerAuthorize
                    || method.GetCustomAttribute<AuthorizeAttribute>() != null
                    || requirePermAttr != null
                    || requireAnyAttr != null;

                foreach (var httpMethod in httpMethods)
                {
                    endpoints.Add(new DiscoveredEndpoint(
                        httpMethod,
                        NormalizeRoute(routeTemplate),
                        allowAnonymous,
                        requiresAuth,
                        permCodes,
                        requireAnyAttr != null,
                        controller.Name,
                        method.Name));
                }
            }
        }

        return endpoints;
    }

    public static string FormatEndpoint(string httpMethod, string routeTemplate)
        => $"{httpMethod.ToUpperInvariant()} {routeTemplate}";

    private static List<string> ResolveHttpMethods(MethodInfo method)
    {
        var methods = new List<string>();
        if (method.GetCustomAttribute<HttpGetAttribute>() != null) methods.Add("GET");
        if (method.GetCustomAttribute<HttpPostAttribute>() != null) methods.Add("POST");
        if (method.GetCustomAttribute<HttpPutAttribute>() != null) methods.Add("PUT");
        if (method.GetCustomAttribute<HttpPatchAttribute>() != null) methods.Add("PATCH");
        if (method.GetCustomAttribute<HttpDeleteAttribute>() != null) methods.Add("DELETE");
        return methods;
    }

    private static string CombineRoutes(string controllerRoute, string? methodRoute)
    {
        if (string.IsNullOrWhiteSpace(methodRoute))
        {
            return NormalizeRoute(controllerRoute);
        }

        if (methodRoute.StartsWith('/'))
        {
            return NormalizeRoute(methodRoute);
        }

        return NormalizeRoute($"{controllerRoute}/{methodRoute}");
    }

    private static string NormalizeRoute(string route)
    {
        if (string.IsNullOrWhiteSpace(route)) return "/";
        var normalized = route.Replace("[controller]", InferControllerToken(route));
        if (!normalized.StartsWith('/')) normalized = $"/{normalized}";
        return normalized.Replace("//", "/");
    }

    private static string InferControllerToken(string route)
    {
        return "[controller]";
    }

    public static string ResolveControllerName(Type controllerType)
    {
        var name = controllerType.Name;
        if (name.EndsWith("Controller", StringComparison.Ordinal))
        {
            name = name[..^"Controller".Length];
        }

        return name;
    }

    public static string ResolveRouteTemplate(DiscoveredEndpoint endpoint, Type controllerType)
    {
        var controllerToken = ResolveControllerName(controllerType);
        return endpoint.RouteTemplate.Replace("[controller]", controllerToken, StringComparison.OrdinalIgnoreCase);
    }
}
