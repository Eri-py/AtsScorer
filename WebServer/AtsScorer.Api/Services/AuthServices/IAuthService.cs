using System.Security.Claims;
using AtsScorer.Api.Dtos;
using AtsScorer.Common;

namespace AtsScorer.Api.Services.AuthServices;

public interface IAuthService
{
    Task<GetUserResponse> GetUserDetailsAsync(
        ClaimsPrincipal user,
        HttpContext httpContext,
        CancellationToken ct
    );

    Task<Result<AuthResult>> RefreshTokenAsync(HttpRequest request, CancellationToken ct);
}
