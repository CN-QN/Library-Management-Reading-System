using api.Common.Constants;

namespace api.Common.Exceptions;

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Forbidden") 
        : base(403, ErrorCodes.PERM_001, message)
    {
    }

    public ForbiddenException(string errorCode, string message) 
        : base(403, errorCode, message)
    {
    }
}
