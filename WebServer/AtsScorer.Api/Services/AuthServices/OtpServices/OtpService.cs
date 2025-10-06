using System;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.Services.EmailServices;
using AtsScorer.Common;
using Microsoft.Extensions.Caching.Memory;

namespace AtsScorer.Api.Services.AuthServices.OtpServices;

public class OtpService(IMemoryCache cache, IEmailService emailService) : IOtpService
{
    public OtpDetails CreateOtp(int otpValidForMinutes)
    {
        var token = (CryptoRandom.NextInt() % 1000000).ToString("000000");
        var expiresAt = DateTime.UtcNow.AddMinutes(otpValidForMinutes);
        return new OtpDetails { Value = token, ExpiresAt = expiresAt };
    }

    public async Task<Result<OtpResponse>> SendOtpAsync(string email, string purpose)
    {
        var cacheKey = $"otp_{purpose}_{email}";

        var otpDetails = CreateOtp(AuthConfig.OtpValidForMinutes);
        var emailResult = await emailService.SendOtpEmailAsync(
            to: email,
            otp: otpDetails.Value,
            otpValidFor: $"{AuthConfig.OtpValidForMinutes} minutes"
        );

        if (!emailResult.IsSuccess)
        {
            // Return bad email result
            return emailResult;
        }

        cache.Set(cacheKey, otpDetails.Value, TimeSpan.FromMinutes(AuthConfig.OtpValidForMinutes));
        return Result<OtpResponse>.Success(new OtpResponse { OtpExpiresAt = otpDetails.ExpiresAt });
    }

    public Result VerifyOtp(string email, string otp, string purpose)
    {
        var cacheKey = $"otp_{purpose}_{email}";

        if (!cache.TryGetValue(cacheKey, out var cachedOtp) || cachedOtp?.ToString() != otp)
        {
            return Result.BadRequest("Invalid or expired verification code");
        }

        cache.Remove(cacheKey);

        // Mark email as verified for this purpose
        var verifiedKey = $"verified_{purpose}_{email}";
        cache.Set(verifiedKey, true, TimeSpan.FromMinutes(15));

        return Result.NoContent();
    }
}
