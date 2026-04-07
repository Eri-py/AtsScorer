using AtsScorer.Api.Data;
using AtsScorer.Api.Data.Entities;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.Services.AuthServices.TokenServices;
using AtsScorer.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AtsScorer.Api.Services.AuthServices.LoginService;

public class LoginService(
    AtsScorerDbContext context,
    ITokenService tokenService,
    ILogger<LoginService> logger
) : ILoginService
{
    public async Task<Result<AuthResult>> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Identifier.ToLower();

        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null)
        {
            logger.LogWarning("Login attempt with unknown email '{Email}'", email);
            return Result.NotFound("Your login credentials don't match an account in our system.");
        }

        var hasher = new PasswordHasher<UserEntity>();
        var verificationResult = hasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.Password
        );

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            logger.LogWarning("Invalid password attempt for email '{Email}'", email);
            return Result.NotFound("Your login credentials don't match an account in our system.");
        }

        using var transaction = await context.Database.BeginTransactionAsync(ct);
        try
        {
            var refreshTokenDetails = tokenService.CreateRefreshToken(user.Id);
            user.RefreshTokens.Add(refreshTokenDetails.Entry);

            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            var accessTokenDetails = tokenService.CreateAccessToken(
                user,
                AuthConfig.AccessTokenValidForMinutes
            );

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
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            logger.LogError(
                ex,
                "Transaction failed during login completion for email '{Email}'",
                email
            );
            return Result.InternalServerError("An unexpected error has occured");
        }
    }
}
