using AtsScorer.Api.Dtos;
using AtsScorer.Api.GrpcContracts;
using AtsScorer.Common;

namespace AtsScorer.Api.Services.SavedFileServices;

public interface ISavedFileService
{
    Task<Result> SaveFileAsync(
        Guid userId,
        IFormFile file,
        string fileName,
        AnalyseResumeResponse analysisResponse
    );

    Task<Result<IReadOnlyList<SavedFileResponse>>> GetUserFilesAsync(Guid userId);
}
