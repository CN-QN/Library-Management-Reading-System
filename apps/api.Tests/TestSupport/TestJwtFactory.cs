using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace api.Tests.TestSupport;

public static class TestJwtFactory
{
    private const string TestSecret = "TestSecretKeyForLibraryHubAdminApiFirstRemediation2026!";

    public static string CreateToken(string userId, IEnumerable<string>? permissions = null, IEnumerable<string>? roles = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, $"{userId}@test.libraryhub.local"),
        };

        foreach (var role in roles ?? [])
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        foreach (var permission in permissions ?? [])
        {
            claims.Add(new Claim("permission", permission));
        }

        var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(TestSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

        var token = new JwtSecurityToken(
            issuer: "LibraryHub",
            audience: "LibraryHubUsers",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
