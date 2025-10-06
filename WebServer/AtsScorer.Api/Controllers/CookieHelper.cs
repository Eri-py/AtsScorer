using System;
using AtsScorer.Api.Services.AuthServices;

namespace AtsScorer.Api.Controllers;

public static class CookieHelper
{
    public static void SetAuthCookies(HttpContext httpContext, AuthResult tokens)
    {
        var accessTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = httpContext.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/api",
            Expires = tokens.AccessTokenExpiresAt,
        };

        var refreshTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = httpContext.Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth/refresh-token",
            Expires = tokens.RefreshTokenExpiresAt,
        };

        httpContext.Response.Cookies.Append("accessToken", tokens.AccessToken, accessTokenOptions);
        httpContext.Response.Cookies.Append(
            "__Secure-refreshToken",
            tokens.RefreshToken,
            refreshTokenOptions
        );
    }
}
