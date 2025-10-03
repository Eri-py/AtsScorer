using AtsScorer.Api.Dtos;
using AtsScorer.Api.Services.AuthServices.SignUpServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AtsScorer.Api.Controllers
{
    [Route("api/sign-up")]
    [ApiController]
    public class SignUpController(ISignUpService signUpService) : ControllerBase
    {
        [HttpPost("start")]
        public async Task<IActionResult> Test([FromBody] StartSignUpRequest request)
        {
            var result = await signUpService.StartSignUpAsync(request);
            Console.WriteLine(result);
            return Ok("This is a test");
        }
    }
}
