using System.Text.Json.Serialization;

namespace api.Common.Models
{
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

        public static ApiResponse<T> SuccessResponse(T data, string message = "Success", object? meta = null, int statusCode = 200)
        {
            return new ApiResponse<T>
            {
                Success = true,
                StatusCode = statusCode,
                Message = message,
                Data = data,
                Meta = meta,
                TraceId = Guid.NewGuid().ToString()
            };
        }

        public static ApiResponse<T> ErrorResponse(int statusCode, string message)
        {
            return new ApiResponse<T>
            {
                Success = false,
                StatusCode = statusCode,
                Message = message,
                TraceId = Guid.NewGuid().ToString()
            };
        }
    }

    public class ApiResponse : ApiResponse<object>
    {
        public static ApiResponse SuccessResponse(string message = "Success", int statusCode = 200)
        {
            return new ApiResponse
            {
                Success = true,
                StatusCode = statusCode,
                Message = message,
                TraceId = Guid.NewGuid().ToString()
            };
        }

        public static ApiResponse ErrorResponse(int statusCode, string message)
        {
            return new ApiResponse
            {
                Success = false,
                StatusCode = statusCode,
                Message = message,
                TraceId = Guid.NewGuid().ToString()
            };
        }
    }
}