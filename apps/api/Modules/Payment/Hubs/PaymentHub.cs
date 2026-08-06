using Microsoft.AspNetCore.SignalR;

namespace api.Modules.Payment.Hubs;

public class PaymentHub : Hub
{
    public async Task JoinOrderGroup(string orderCode)
    {
        if (!string.IsNullOrWhiteSpace(orderCode))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"order_{orderCode.Trim()}");
        }
    }

    public async Task LeaveOrderGroup(string orderCode)
    {
        if (!string.IsNullOrWhiteSpace(orderCode))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order_{orderCode.Trim()}");
        }
    }
}
