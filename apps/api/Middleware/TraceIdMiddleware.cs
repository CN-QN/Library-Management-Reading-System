namespace api.Middleware;

public class TraceIdMiddleware
{
    private readonly RequestDelegate _next;
    private const string TraceIdHeaderKey = "X-Trace-Id";

    public TraceIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string traceId;
        if (context.Request.Headers.TryGetValue(TraceIdHeaderKey, out var headerTraceId))
        {
            traceId = headerTraceId.ToString();
        }
        else
        {
            traceId = Guid.NewGuid().ToString("n");
        }

        context.Items["TraceId"] = traceId;
        context.Response.Headers[TraceIdHeaderKey] = traceId;

        await _next(context);
    }
}
