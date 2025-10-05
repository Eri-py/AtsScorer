using AtsScorer.Api.Data;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.Services.AuthServices.OtpServices;
using AtsScorer.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace AtsScorer.Api.Services.AuthServices.SignUpServices;

public class SignUpService(AtsScorerDbContext context, IOtpService otpService, IMemoryCache cache)
    : ISignUpService
{
    public async Task<Result<OtpResponse>> StartSignUpAsync(StartSignUpRequest request)
    {
        // Check if user with email exists
        var email = request.Email.ToLower();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is not null)
        {
            return Result.Conflict("Email taken");
        }

        var otpResult = await otpService.SendOtpAsync(email, "signup");
        return otpResult;
    }

    public Result VerifyOtpAsync(VerifyOtpRequest request)
    {
        var email = request.Email.ToLower();
        var otp = request.Otp;

        if (
            cache.TryGetValue(email, out var cachedOtp)
            && cachedOtp is not null
            && otp == cachedOtp.ToString()
        )
        {
            cache.Remove(email);
            return Result.NoContent();
        }
        else
        {
            return Result.BadRequest("Invalid or expired verification code");
        }
    }

    public Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request)
    {
        throw new NotImplementedException();
    }

    public Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request)
    {
        throw new NotImplementedException();
    }
}
