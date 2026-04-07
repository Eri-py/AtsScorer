using System.Security.Claims;
using AtsScorer.Api.Data;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.Extensions;
using AtsScorer.Api.Services.AuthServices.TokenServices;
using AtsScorer.Common;
using Microsoft.EntityFrameworkCore;

namespace AtsScorer.Api.Services.AuthServices;

public class AuthService(
    ITokenService tokenService,
    AtsScorerDbContext context,
    ILogger<AuthService> logger
) : IAuthService
{
    public async Task<GetUserResponse> GetUserDetailsAsync(
        ClaimsPrincipal user,
        HttpContext httpContext,
        CancellationToken ct
    )
    {
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return new GetUserResponse { IsAuthenticated = false, User = null };
        }

        var userDto = await GetUserDtoAsync(userGuid, ct);
        if (userDto == null)
        {
            logger.LogWarning("get-user-details called for deleted user {UserId}", userId);
            httpContext.ClearAuthCookies();

            return new GetUserResponse { IsAuthenticated = false, User = null };
        }

        return new GetUserResponse { IsAuthenticated = true, User = userDto };
    }

    public Task<Result<AuthResult>> RefreshTokenAsync(HttpRequest request, CancellationToken ct)
    {
        var refreshToken = request.Cookies["__Secure-refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Task.FromResult<Result<AuthResult>>(
                Result.BadRequest("Invalid or expired refresh token")
            );
        }

        return tokenService.RotateRefreshTokenAsync(refreshToken, ct);
    }

    private async Task<UserDto?> GetUserDtoAsync(Guid userGuid, CancellationToken ct)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userGuid, ct);
        if (user == null)
        {
            return null;
        }

        return new UserDto
        {
            Id = user.Id.ToString(),
            Username = user.Email.Split('@')[0],
            Email = user.Email,
            Firstname = null,
            Lastname = null,
        };
    }
}
