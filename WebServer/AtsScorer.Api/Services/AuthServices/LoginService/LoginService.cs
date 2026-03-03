using AtsScorer.Api.Data;
using AtsScorer.Api.Data.Entities;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.Services.AuthServices.TokenServices;
using AtsScorer.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AtsScorer.Api.Services.AuthServices.LoginService;

public class LoginService(AtsScorerDbContext context, ITokenService tokenService) : ILoginService
{
    public async Task<Result<AuthResult>> LoginAsync(LoginRequest request)
    {
        var email = request.Identifier.ToLower();

        // Find user by email
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            return Result.Unauthorized("Invalid email or password");
        }

        // Verify password
        var hasher = new PasswordHasher<UserEntity>();
        var verificationResult = hasher.VerifyHashedPassword(
            null!,
            user.PasswordHash,
            request.Password
        );

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return Result.Unauthorized("Invalid email or password");
        }

        // Create tokens
        var accessTokenDetails = tokenService.CreateAccessToken(
            user,
            AuthConfig.AccessTokenValidForMinutes
        );

        var refreshTokenDetails = tokenService.CreateRefreshToken(
            AuthConfig.RefreshTokenValidForDays
        );

        // Store refresh token in database
        var refreshTokenEntry = new RefreshTokenEntity
        {
            TokenHash = tokenService.HashToken(refreshTokenDetails.Value),
            TokenExpiresAt = refreshTokenDetails.ExpiresAt,
            UserId = user.Id,
        };
        context.RefreshTokens.Add(refreshTokenEntry);
        await context.SaveChangesAsync();

        return Result<AuthResult>.Success(
            new AuthResult
            {
                AccessToken = accessTokenDetails.Value,
                RefreshToken = refreshTokenDetails.Value,
                AccessTokenExpiresAt = accessTokenDetails.ExpiresAt,
                RefreshTokenExpiresAt = refreshTokenDetails.ExpiresAt,
            }
        );
    }
}
