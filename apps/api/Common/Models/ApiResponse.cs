namespace api.Common.Models
{
    // Class ApiResponse không generic
    public class ApiResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public object? Data { get; set; }
        public object? Metadata { get; set; }

        public static ApiResponse SuccessResponse(string message = "Success", object? data = null, object? metadata = null, int statusCode = 200)
        {
            return new ApiResponse
            {
                Success = true,
                Message = message,
                StatusCode = statusCode,
                Data = data,
                Metadata = metadata
            };
        }

        public static ApiResponse ErrorResponse(int statusCode, string message, object? data = null)
        {
            return new ApiResponse
            {
                Success = false,
                Message = message,
                StatusCode = statusCode,
                Data = data
            };
        }
    }

    // Class ApiResponse<T> generic
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public T? Data { get; set; }
        public object? Metadata { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string message = "Success", object? metadata = null, int statusCode = 200)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                StatusCode = statusCode,
                Data = data,
                Metadata = metadata
            };
        }

        public static ApiResponse<T> ErrorResponse(int statusCode, string message)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                StatusCode = statusCode,
                Data = default
            };
        }
    }
}