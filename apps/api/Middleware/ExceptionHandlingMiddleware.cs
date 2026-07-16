using System.Net;
using System.Text.Json;
using api.Common.Constants;
using api.Common.Exceptions;
using api.Common.Models;
using FluentValidation;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next, 
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var traceId = context.Items["TraceId"]?.ToString() ?? context.TraceIdentifier;
        var errorResponse = new ErrorResponse
        {
            Success = false,
            TraceId = traceId
        };

        switch (exception)
        {
            case AppException appEx:
                context.Response.StatusCode = appEx.StatusCode;
                errorResponse.StatusCode = appEx.StatusCode;
                errorResponse.ErrorCode = appEx.ErrorCode;
                errorResponse.Message = appEx.Message;
                break;

            case ValidationException valEx:
                context.Response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
                errorResponse.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
                errorResponse.ErrorCode = ErrorCodes.VALIDATION;
                errorResponse.Message = "Validation failed";
                errorResponse.Details = valEx.Errors.Select(e => 
                    new ValidationErrorDetail(e.PropertyName, e.ErrorCode ?? "invalid", e.ErrorMessage));
                break;

            default:
                _logger.LogError(exception, "Unhandled exception occurred. TraceId: {TraceId}", traceId);
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.ErrorCode = ErrorCodes.SYS_001;
                
                errorResponse.Message = _env.IsDevelopment() 
                    ? $"{exception.Message} | StackTrace: {exception.StackTrace}" 
                    : "An unexpected error occurred. Please try again later.";
                break;
        }

        var json = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });
        
        return context.Response.WriteAsync(json);
    }
}
