using AtsScorer.Api.Dtos;
using AtsScorer.Api.Extensions;
using AtsScorer.Api.Services.AuthServices;
using AtsScorer.Api.Services.AuthServices.SignUpServices;
using Microsoft.AspNetCore.Mvc;

namespace AtsScorer.Api.Controllers
{
    [Route("api/sign-up")]
    [ApiController]
    public class SignUpController(ISignUpService signUpService) : ControllerBase
    {
        [HttpPost("start")]
        public async Task<ActionResult<OtpResponse>> StartSignUp(
            [FromBody] StartSignUpRequest request,
            CancellationToken ct
        )
        {
            var result = await signUpService.StartSignUpAsync(request, ct);
            return result.ToActionResult();
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifySignUpOtp([FromBody] VerifyOtpRequest request)
        {
            var result = signUpService.VerifyOtp(request);
            return result.ToActionResult();
        }

        [HttpPost("resend-otp")]
        public async Task<ActionResult<OtpResponse>> ResendOtp(
            [FromBody] ResendOtpRequest request,
            CancellationToken ct
        )
        {
            var result = await signUpService.ResendOtpAsync(request, ct);
            return result.ToActionResult();
        }

        [HttpPost("complete")]
        public async Task<ActionResult<AuthResult>> CompleteSignUp(
            [FromBody] CompleteSignUpRequest request,
            CancellationToken ct
        )
        {
            var result = await signUpService.CompleteSignUpAsync(request, ct);
            if (!result.IsSuccess)
            {
                return result.ToActionResult();
            }

            HttpContext.SetAuthCookies(result.Content!);
            return NoContent();
        }
    }
}
