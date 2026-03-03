using AtsScorer.Api.Dtos;
using AtsScorer.Api.Extensions;
using AtsScorer.Api.Services.AuthServices;
using AtsScorer.Api.Services.AuthServices.LoginService;
using Microsoft.AspNetCore.Mvc;

namespace AtsScorer.Api.Controllers;

[Route("api/login")]
[ApiController]
public class LoginController(ILoginService loginService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<AuthResult>> Login([FromBody] LoginRequest request)
    {
        var result = await loginService.LoginAsync(request);
        if (!result.IsSuccess)
        {
            return result.ToActionResult();
        }

        CookieHelper.SetAuthCookies(HttpContext, result.Content!);
        return NoContent();
    }
}
