using AtsScorer.Api.Data.Entities;
using AtsScorer.Common;

namespace AtsScorer.Api.Services.AuthServices.TokenServices;

public record TokenDetails
{
    public required string Value { get; set; }
    public required DateTime ExpiresAt { get; set; }
}

public interface ITokenService
{
    public TokenDetails CreateAccessToken(UserEntity user, int tokenValidFor);
    public TokenDetails CreateRefreshToken(int tokenValidForDays);
    public Task<Result<AuthResult>> VerifyRefreshTokenAsync(string refreshToken);
    public string HashToken(string token);
}
