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
            [FromBody] StartSignUpRequest request
        )
        {
            var result = await signUpService.StartSignUpAsync(request);
            return result.ToActionResult();
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifySignUpOtp([FromBody] VerifyOtpRequest request)
        {
            var result = signUpService.VerifyOtp(request);
            return result.ToActionResult();
        }

        [HttpPost("resend-otp")]
        public async Task<ActionResult<OtpResponse>> ResendOtp([FromBody] ResendOtpRequest request)
        {
            var result = await signUpService.ResendOtpAsync(request);
            return result.ToActionResult();
        }

        [HttpPost("complete")]
        public async Task<ActionResult<AuthResult>> ResendOtp(
            [FromBody] CompleteSignUpRequest request
        )
        {
            var result = await signUpService.CompleteSignUpAsync(request);
            if (!result.IsSuccess)
            {
                return result.ToActionResult();
            }

            CookieHelper.SetAuthCookies(HttpContext, result.Content!);
            return NoContent();
        }
    }
}
