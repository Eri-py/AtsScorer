using AtsScorer.Api.Data.Entities;
using AtsScorer.Common;

namespace AtsScorer.Api.Services.AuthServices.TokenServices;

public record AccessTokenDetails
{
    public required string Value { get; set; }
    public required DateTime ExpiresAt { get; set; }
}

public record RefreshTokenDetails
{
    public required string Value { get; set; }
    public required DateTime ExpiresAt { get; set; }
    public required RefreshTokenEntity Entry { get; set; }
}

public interface ITokenService
{
    public AccessTokenDetails CreateAccessToken(UserEntity user, int tokenValidFor);
    public RefreshTokenDetails CreateRefreshToken(Guid userId);
    public Task<Result<AuthResult>> RotateRefreshTokenAsync(
        string refreshToken,
        CancellationToken ct
    );
    public string HashToken(string token);
}
