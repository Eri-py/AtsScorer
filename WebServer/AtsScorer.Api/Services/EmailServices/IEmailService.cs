using AtsScorer.Common;

namespace AtsScorer.Api.Services.EmailServices;

public interface IEmailService
{
    public Task<Result> SendEmailAsync(string to, string subject, string body);
    public Task<Result> SendOtpEmailAsync(string to, string otp, string otpValidFor);
}
