namespace api.Modules.Payment.Services;

public interface IRedisPaymentService
{
    Task PublishPaymentSuccessAsync(string orderCode, object payload);
}
