namespace api.Common.Exceptions;

public class ConflictException : AppException
{
    public ConflictException(string errorCode, string message) 
        : base(409, errorCode, message)
    {
    }
}
