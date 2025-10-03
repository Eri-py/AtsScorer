using AtsScorer.Api.Dtos;
using AtsScorer.Api.Results;

namespace AtsScorer.Api.Services.AuthServices.SignUpServices;

public interface ISignUpService
{
    /// <summary>
    /// Initiates the sign-up process by validating and storing initial user information.
    /// </summary>
    /// <param name="request">The sign-up request containing email. See <see cref="StartSignUpRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="StartSignUpResponse"/></returns>
    public Task<Result<StartSignUpResponse>> StartSignUpAsync(StartSignUpRequest request);

    /// <summary>
    /// Verifies the One-Time Passcode (OTP) sent to the user's email during registration.
    /// </summary>
    /// <param name="request">The verification request containing email and OTP. See <see cref="VerifyOtpRequest"/></param>
    /// <returns>Result</returns>
    /// <remarks>
    /// Successful verification marks the email as confirmed in the system.
    /// </remarks>
    public Task<Result> VerifyOtpAsync(VerifyOtpRequest request);

    /// <summary>
    /// Completes the sign-up process by saving all user details and creating an account.
    /// </summary>
    /// <param name="request">The complete registration request containing all user details. See <see cref="CompleteRegistrationRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="AuthResult"/></returns>
    /// <remarks>
    /// This final step requires all user information and creates the actual user account.
    /// </remarks>
    public Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request);
}
