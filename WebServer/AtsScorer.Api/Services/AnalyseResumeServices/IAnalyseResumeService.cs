using AtsScorer.Api.GrpcContracts;
using AtsScorer.Common;

namespace AtsScorer.Api.Services.AnalyseResumeServices;

public interface IAnalyseResumeService
{
    public Task<Result<AnalyseResumeResponse>> AnalyseResumeAsync(
        Guid? userId,
        IFormFile resume,
        string fileName,
        string jobDescription
    );
}
