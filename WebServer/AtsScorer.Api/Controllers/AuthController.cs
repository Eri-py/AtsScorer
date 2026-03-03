using System.Security.Claims;
using AtsScorer.Api.Services.AuthServices.TokenServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtsScorer.Api.Controllers;

[Route("api/auth")]
[ApiController]
public class AuthController(ITokenService tokenService) : ControllerBase
{
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies["__Secure-refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { message = "No refresh token provided" });
        }

        var result = await tokenService.VerifyRefreshTokenAsync(refreshToken);
        if (!result.IsSuccess)
        {
            // Clear stale cookies on failure
            ClearAuthCookies();
            return Unauthorized(new { message = result.Message });
        }

        CookieHelper.SetAuthCookies(HttpContext, result.Content!);
        return NoContent();
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        ClearAuthCookies();
        return NoContent();
    }

    [HttpGet("get-user-details")]
    public IActionResult GetUserDetails()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = User.FindFirstValue(ClaimTypes.Email);

        if (userId is null || email is null)
        {
            return Ok(new { isAuthenticated = false, user = (object?)null });
        }

        var username = email.Split('@')[0];

        return Ok(
            new
            {
                isAuthenticated = true,
                user = new
                {
                    id = userId,
                    username,
                    email,
                    firstname = (string?)null,
                    lastname = (string?)null,
                },
            }
        );
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete("accessToken", new CookieOptions { Path = "/api" });
        Response.Cookies.Delete(
            "__Secure-refreshToken",
            new CookieOptions { Path = "/api/auth/refresh-token" }
        );
    }
}
