using AtsScorer.Api.GrpcContracts;
using AtsScorer.Common;
using Google.Protobuf;

namespace AtsScorer.Api.Services.AnalyseResumeServices;

public class AnalyseResumeService(AnalyseResume.AnalyseResumeClient client) : IAnalyseResumeService
{
    public async Task<Result<AnalyseResumeResponse>> AnalyseResumeAsync(
        IFormFile resume,
        string fileName,
        string jobDescription
    )
    {
        if (resume == null || resume.Length == 0)
        {
            return Result.BadRequest("File is Empty");
        }

        using var memoryStream = new MemoryStream();
        await resume.CopyToAsync(memoryStream);
        var fileBytes = memoryStream.ToArray();

        var request = new AnalyseResumeRequest
        {
            File = ByteString.CopyFrom(fileBytes),
            FileName = fileName,
            JobDescription = jobDescription,
        };

        var grpcResponse = await client.AnalyzeResumeAsync(request);

        return Result<AnalyseResumeResponse>.Success(grpcResponse);
    }
}
