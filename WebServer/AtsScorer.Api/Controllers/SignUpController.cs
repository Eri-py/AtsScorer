using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AtsScorer.Api.Controllers
{
    [Route("api/sign-up")]
    [ApiController]
    public class SignUpController : ControllerBase
    {
        [HttpGet]
        public IActionResult Test()
        {
            return Ok("This is a test");
        }
    }
}
