using System;
using AtsScorer.Api.Services.AuthServices.SignUpServices;

namespace AtsScorer.Api.Services.AuthServices;

public static class AuthServicesRegistration
{
    public static void AddAuthServices(this IServiceCollection services)
    {
        services.AddScoped<ISignUpService, SignUpService>();
    }
}
