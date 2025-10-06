using AtsScorer.Api.Data;
using AtsScorer.Api.Data.Entities;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.Services.AuthServices.OtpServices;
using AtsScorer.Api.Services.AuthServices.TokenServices;
using AtsScorer.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace AtsScorer.Api.Services.AuthServices.SignUpServices;

public class SignUpService(
    AtsScorerDbContext context,
    IOtpService otpService,
    ITokenService tokenService,
    IMemoryCache cache
) : ISignUpService
{
    private const string purpose = "signup";

    public async Task<Result<OtpResponse>> StartSignUpAsync(StartSignUpRequest request)
    {
        // Check if user with email exists
        var email = request.Email.ToLower();
        if (await IsExistingUser(email))
        {
            return Result.Conflict("Email taken");
        }

        var otpResult = await otpService.SendOtpAsync(email, purpose);
        return otpResult;
    }

    public Result VerifyOtp(VerifyOtpRequest request)
    {
        var email = request.Email.ToLower();
        var otp = request.Otp;
        return otpService.VerifyOtp(email, otp, purpose);
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request)
    {
        var email = request.Email.ToLower();
        var otpResult = await otpService.SendOtpAsync(email, purpose);
        return otpResult;
    }

    public async Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request)
    {
        var email = request.Email.ToLower();

        // Check if email was verified via OTP
        var verifiedKey = $"verified_{purpose}_{email}";
        if (!cache.TryGetValue(verifiedKey, out _))
        {
            return Result.BadRequest("Please verify your email first");
        }

        // Check if user already exists
        if (await IsExistingUser(email))
        {
            cache.Remove(verifiedKey);
            return Result.Conflict("Email taken");
        }

        var hasher = new PasswordHasher<UserEntity>();
        var passwordHash = hasher.HashPassword(null!, request.Password);

        using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // Create user and add to database
            var user = new UserEntity
            {
                Email = email,
                PasswordHash = passwordHash,
                CreatedAt = DateTime.UtcNow,
            };
            context.Users.Add(user);

            // create refresh token and add to database
            var refreshTokenDetails = tokenService.CreateRefreshToken(
                AuthConfig.RefreshTokenValidForDays
            );
            var refreshTokenEntry = new RefreshTokenEntity
            {
                TokenHash = tokenService.HashToken(refreshTokenDetails.Value),
                TokenExpiresAt = refreshTokenDetails.ExpiresAt,
                UserId = user.Id,
            };
            user.RefreshTokens.Add(refreshTokenEntry);

            // Save changes to database
            await context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Remove verification flag after successful signup
            cache.Remove(verifiedKey);

            // Create access token and return all token informations
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
        catch (Exception)
        {
            await transaction.RollbackAsync();
            return Result.InternalServerError("An unexpected error has occured");
        }
    }

    private async Task<bool> IsExistingUser(string email) =>
        await context.Users.AnyAsync(u => u.Email == email);
}
