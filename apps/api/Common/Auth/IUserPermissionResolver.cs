namespace api.Auth;

public interface IUserPermissionResolver
{
    Task<List<string>> GetCachedPermissionsAsync(string userId);
}
