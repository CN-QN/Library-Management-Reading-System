using api.Common.Constants;

namespace api.Common.Exceptions;

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Unauthorized") 
        : base(401, ErrorCodes.AUTH_001, message)
    {
    }
    
    public UnauthorizedException(string errorCode, string message) 
        : base(401, errorCode, message)
    {
    }
}
