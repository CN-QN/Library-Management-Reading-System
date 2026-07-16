using System.Text.Json.Serialization;

namespace api.Common.Models;

public class ErrorResponse
{
    public bool Success { get; set; } = false;
    public int StatusCode { get; set; }
    public string ErrorCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IEnumerable<ValidationErrorDetail>? Details { get; set; }
    
    public string TraceId { get; set; } = string.Empty;
}

public class ValidationErrorDetail
{
    public string Field { get; set; } = string.Empty;
    public string Rule { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public ValidationErrorDetail(string field, string rule, string message)
    {
        Field = field;
        Rule = rule;
        Message = message;
    }
}
