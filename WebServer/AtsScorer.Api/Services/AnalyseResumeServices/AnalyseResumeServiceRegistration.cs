using System;
using AtsScorer.Api.GrpcContracts;

namespace AtsScorer.Api.Services.AnalyseResumeServices;

public static class AnalyseResumeServiceRegistration
{
    public static void AddResumeAnalysisServices(
        this IServiceCollection services,
        IConfiguration configs
    )
    {
        services.AddGrpcClient<AnalyseResume.AnalyseResumeClient>(options =>
            options.Address = new Uri(configs["GrpcServices:Development"]!)
        );
        services.AddScoped<IAnalyseResumeService, AnalyseResumeService>();
    }
}
