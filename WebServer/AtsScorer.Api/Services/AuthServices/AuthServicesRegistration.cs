using System.Text;
using AtsScorer.Api.Services.AuthServices.OtpServices;
using AtsScorer.Api.Services.AuthServices.SignUpServices;
using AtsScorer.Api.Services.AuthServices.TokenServices;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace AtsScorer.Api.Services.AuthServices;

public static class AuthServicesRegistration
{
    public static void AddAuthServices(this IServiceCollection services, IConfiguration configs)
    {
        // JWT Service
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = configs["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = configs["Jwt:Audience"],
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configs["Jwt:Secret"]!)
                    ),
                };
                //  Check Cookie for acccess token rather than header
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = context.Request.Cookies["accessToken"];
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddScoped<ITokenService, JwtService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<ISignUpService, SignUpService>();
    }
}
