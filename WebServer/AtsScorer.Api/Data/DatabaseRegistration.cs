using System;
using Microsoft.EntityFrameworkCore;

namespace AtsScorer.Api.Data;

public static class DatabaseRegistration
{
    public static void AddDatabases(this IServiceCollection services, IConfiguration configs)
    {
        var environment = configs["ASPNETCORE_ENVIRONMENT"];
        if (environment == "Development")
        {
            // Database Access
            services.AddDbContext<AtsScorerDbContext>(options =>
                options.UseNpgsql(configs.GetConnectionString("Development"))
            );
        }
    }
}
