using AtsScorer.Api.GrpcContracts;
using AtsScorer.Api.Services.SavedFileServices;
using AtsScorer.Common;
using Google.Protobuf;

namespace AtsScorer.Api.Services.AnalyseResumeServices;

public class AnalyseResumeService(
    AnalyseResume.AnalyseResumeClient client,
    ISavedFileService savedFileService
) : IAnalyseResumeService
{
    public async Task<Result<AnalyseResumeResponse>> AnalyseResumeAsync(
        Guid? userId,
        IFormFile resume,
        string fileName,
        string jobDescription
    )
    {
        if (resume == null || resume.Length == 0)
        {
            return Result.BadRequest("File is Empty");
        }

        var safeFileName = string.IsNullOrWhiteSpace(fileName) ? resume.FileName : fileName;

        using var memoryStream = new MemoryStream();
        await resume.CopyToAsync(memoryStream);
        var fileBytes = memoryStream.ToArray();

        var request = new AnalyseResumeRequest
        {
            File = ByteString.CopyFrom(fileBytes),
            FileName = safeFileName,
            JobDescription = jobDescription,
        };

        var grpcResponse = await client.AnalyzeResumeAsync(request);

        // Persist chat history only for authenticated users.
        if (userId.HasValue)
        {
            var saveResult = await savedFileService.SaveFileAsync(
                userId.Value,
                resume,
                safeFileName,
                grpcResponse
            );
            if (!saveResult.IsSuccess)
            {
                return saveResult;
            }
        }

        return Result<AnalyseResumeResponse>.Success(grpcResponse);
    }
}
