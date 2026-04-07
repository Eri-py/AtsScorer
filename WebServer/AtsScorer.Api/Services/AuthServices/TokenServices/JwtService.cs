using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AtsScorer.Api.Data;
using AtsScorer.Api.Data.Entities;
using AtsScorer.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AtsScorer.Api.Services.AuthServices.TokenServices;

public class JwtService(IConfiguration configuration, AtsScorerDbContext context) : ITokenService
{
    public AccessTokenDetails CreateAccessToken(UserEntity user, int tokenValidForMinutes)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(tokenValidForMinutes);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        return new AccessTokenDetails
        {
            Value = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor),
            ExpiresAt = expiresAt,
        };
    }

    private static (string Value, DateTime ExpiresAt) GenerateRefreshToken(int tokenValidForDays)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var token = new StringBuilder(64);
        for (int i = 0; i < 64; i++)
        {
            token.Append(chars[CryptoRandom.NextInt() % chars.Length]);
        }

        return (token.ToString(), DateTime.UtcNow.AddDays(tokenValidForDays));
    }

    public RefreshTokenDetails CreateRefreshToken(Guid userId)
    {
        var refreshTokenDetails = GenerateRefreshToken(AuthConfig.RefreshTokenValidForDays);
        var refreshTokenEntry = new RefreshTokenEntity
        {
            TokenHash = HashToken(refreshTokenDetails.Value),
            TokenExpiresAt = refreshTokenDetails.ExpiresAt,
            UserId = userId,
        };

        return new RefreshTokenDetails
        {
            Value = refreshTokenDetails.Value,
            ExpiresAt = refreshTokenDetails.ExpiresAt,
            Entry = refreshTokenEntry,
        };
    }

    public string HashToken(string token) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public async Task<Result<AuthResult>> RotateRefreshTokenAsync(
        string refreshToken,
        CancellationToken ct
    )
    {
        using var transaction = await context.Database.BeginTransactionAsync(ct);
        try
        {
            var tokenEntry = await context
                .RefreshTokens.Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == HashToken(refreshToken), ct);

            if (
                tokenEntry is null
                || tokenEntry.User is null
                || tokenEntry.TokenExpiresAt < DateTime.UtcNow
            )
            {
                return Result.Unauthorized("Invalid or expired refresh token");
            }

            var nextRefreshToken = CreateRefreshToken(tokenEntry.UserId);
            var accessToken = CreateAccessToken(
                tokenEntry.User,
                AuthConfig.AccessTokenValidForMinutes
            );

            tokenEntry.TokenHash = nextRefreshToken.Entry.TokenHash;
            tokenEntry.TokenExpiresAt = nextRefreshToken.ExpiresAt;

            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return Result<AuthResult>.Success(
                new()
                {
                    AccessToken = accessToken.Value,
                    RefreshToken = nextRefreshToken.Value,
                    AccessTokenExpiresAt = accessToken.ExpiresAt,
                    RefreshTokenExpiresAt = nextRefreshToken.ExpiresAt,
                }
            );
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            return Result.InternalServerError("An unexpected error has occured");
        }
    }
}
