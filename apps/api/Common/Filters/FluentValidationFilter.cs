using Microsoft.AspNetCore.Mvc.Filters;
using FluentValidation;

namespace api.Common.Filters;

public class FluentValidationFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _serviceProvider;

    public FluentValidationFilter(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument == null) continue;

            var argumentType = argument.GetType();
            var validatorType = typeof(IValidator<>).MakeGenericType(argumentType);
            var validator = _serviceProvider.GetService(validatorType) as IValidator;

            if (validator != null)
            {
                var validationContextType = typeof(ValidationContext<>).MakeGenericType(argumentType);
                var validationContext = Activator.CreateInstance(validationContextType, argument) as IValidationContext;

                if (validationContext != null)
                {
                    var validationResult = await validator.ValidateAsync(validationContext);
                    if (!validationResult.IsValid)
                    {
                        throw new ValidationException(validationResult.Errors);
                    }
                }
            }
        }

        await next();
    }
}
