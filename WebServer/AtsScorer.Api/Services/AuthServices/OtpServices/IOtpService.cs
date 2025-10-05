using AtsScorer.Api.Dtos;
using AtsScorer.Common;

namespace AtsScorer.Api.Services.AuthServices.OtpServices;

public record OtpDetails
{
    public required string Value { get; set; }
    public required DateTime ExpiresAt { get; set; }
}

public interface IOtpService
{
    public OtpDetails CreateOtp(int otpValidForMinutes);
    public Task<Result<OtpResponse>> SendOtpAsync(string email, string purpose);
    public Result VerifyOtp(string email, string otp, string purpose);
}
