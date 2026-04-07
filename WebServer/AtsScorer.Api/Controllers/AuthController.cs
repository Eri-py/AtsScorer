using AtsScorer.Api.Dtos;
using AtsScorer.Api.Extensions;
using AtsScorer.Api.Services.AuthServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtsScorer.Api.Controllers;

[Route("api/auth")]
[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpGet("get-user-details")]
    [Authorize]
    public async Task<ActionResult<GetUserResponse>> GetUserDetails(CancellationToken ct)
    {
        var response = await authService.GetUserDetailsAsync(User, HttpContext, ct);
        return Ok(response);
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<AuthResult>> RefreshToken(CancellationToken ct)
    {
        var result = await authService.RefreshTokenAsync(Request, ct);
        if (!result.IsSuccess)
        {
            return result.ToActionResult();
        }

        HttpContext.SetAuthCookies(result.Content!);
        return NoContent();
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        HttpContext.ClearAuthCookies();
        return NoContent();
    }
}
