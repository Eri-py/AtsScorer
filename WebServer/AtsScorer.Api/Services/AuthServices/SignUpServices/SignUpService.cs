using AtsScorer.Api.Data;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.Services.AuthServices.OtpServices;
using AtsScorer.Common;
using Microsoft.EntityFrameworkCore;

namespace AtsScorer.Api.Services.AuthServices.SignUpServices;

public class SignUpService(AtsScorerDbContext context, IOtpService otpService) : ISignUpService
{
    private const string purpose = "signup";

    public async Task<Result<OtpResponse>> StartSignUpAsync(StartSignUpRequest request)
    {
        // Check if user with email exists
        var email = request.Email.ToLower();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is not null)
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

    public Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request)
    {
        throw new NotImplementedException();
    }
}
