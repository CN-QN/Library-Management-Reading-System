using System.Text.Json.Serialization;

namespace api.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public T? Data { get; set; }
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Meta { get; set; }
    
    public string TraceId { get; set; } = string.Empty;

    public static ApiResponse<T> SuccessResponse(T data, string message = "Success", object? meta = null, string traceId = "")
    {
        return new ApiResponse<T>
        {
            Success = true,
            StatusCode = 200,
            Message = message,
            Data = data,
            Meta = meta,
            TraceId = traceId
        };
    }

    public static ApiResponse<T> ErrorResponse(int statusCode, string message, string traceId = "")
    {
        return new ApiResponse<T>
        {
            Success = false,
            StatusCode = statusCode,
            Message = message,
            TraceId = traceId
        };
    }
}

public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse SuccessResponse(string message = "Success", string traceId = "")
    {
        return new ApiResponse
        {
            Success = true,
            StatusCode = 200,
            Message = message,
            TraceId = traceId
        };
    }
}
