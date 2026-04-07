using System.Net;
using System.Text.Json;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using AtsScorer.Api.Data;
using AtsScorer.Api.Data.Entities;
using AtsScorer.Api.Dtos;
using AtsScorer.Api.GrpcContracts;
using AtsScorer.Common;
using Microsoft.EntityFrameworkCore;

namespace AtsScorer.Api.Services.SavedFileServices;

public class SavedFileService : ISavedFileService
{
    private readonly AtsScorerDbContext _context;
    private readonly IAmazonS3 _s3Client;
    private readonly ILogger<SavedFileService> _logger;
    private readonly string _bucketName;

    public SavedFileService(
        AtsScorerDbContext context,
        IAmazonS3 s3Client,
        IConfiguration config,
        ILogger<SavedFileService> logger
    )
    {
        _context = context;
        _s3Client = s3Client;
        _logger = logger;
        _bucketName =
            config["S3:BucketName"]
            ?? throw new InvalidOperationException("Missing S3:BucketName configuration.");
    }

    public async Task<Result> SaveFileAsync(
        Guid userId,
        IFormFile file,
        string fileName,
        string jobDescription,
        AnalyseResumeResponse analysisResponse
    )
    {
        if (file.Length == 0)
        {
            return Result.BadRequest("File is empty.");
        }

        var fileExtension = Path.GetExtension(fileName);
        var objectKey = $"{userId}/{Guid.NewGuid()}{fileExtension}";
        var analysisObjectKey = BuildAnalysisObjectKey(objectKey);
        var jobDescriptionObjectKey = BuildJobDescriptionObjectKey(objectKey);

        try
        {
            await EnsureBucketExistsAsync();

            await using var stream = file.OpenReadStream();
            var putObjectRequest = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = objectKey,
                InputStream = stream,
                ContentType = file.ContentType,
            };

            await _s3Client.PutObjectAsync(putObjectRequest);

            var analysisPayload = new SavedAnalysisPayload
            {
                MissingKeywords = analysisResponse.MissingKeywords.ToList(),
                SkillsAnalysis = analysisResponse.SkillsAnalysis.ToDictionary(
                    pair => pair.Key,
                    pair => pair.Value
                ),
            };

            var analysisJson = JsonSerializer.Serialize(analysisPayload);
            var putAnalysisRequest = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = analysisObjectKey,
                ContentBody = analysisJson,
                ContentType = "application/json",
            };

            await _s3Client.PutObjectAsync(putAnalysisRequest);

            var putJobDescriptionRequest = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = jobDescriptionObjectKey,
                ContentBody = jobDescription,
                ContentType = "text/plain; charset=utf-8",
            };

            await _s3Client.PutObjectAsync(putJobDescriptionRequest);

            var savedFile = new SavedFileEntity
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OriginalFileName = fileName,
                ObjectKey = objectKey,
                ContentType = file.ContentType,
                SizeInBytes = file.Length,
                CreatedAt = DateTime.UtcNow,
                AnalysisStatus = analysisResponse.Status,
                MatchScore = analysisResponse.MatchScore,
                Feedback = analysisResponse.Feedback,
                MissingKeywordsJson = "[]",
                SkillsAnalysisJson = "{}",
            };

            _context.SavedFiles.Add(savedFile);
            await _context.SaveChangesAsync();

            return Result.NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to save file for user {UserId}. Bucket: {BucketName}, ObjectKey: {ObjectKey}, AnalysisKey: {AnalysisObjectKey}, JobDescriptionKey: {JobDescriptionObjectKey}",
                userId,
                _bucketName,
                objectKey,
                analysisObjectKey,
                jobDescriptionObjectKey
            );
            return Result.InternalServerError("Failed to save file.");
        }
    }

    public async Task<Result<IReadOnlyList<SavedFileResponse>>> GetUserFilesAsync(Guid userId)
    {
        var files = await _context
            .SavedFiles.Where(file => file.UserId == userId)
            .OrderByDescending(file => file.CreatedAt)
            .ToListAsync();

        var responses = new List<SavedFileResponse>(files.Count);

        foreach (var file in files)
        {
            var payload = await ReadAnalysisPayloadAsync(file.ObjectKey);

            var missingKeywords =
                payload?.MissingKeywords
                ?? JsonSerializer.Deserialize<List<string>>(file.MissingKeywordsJson)
                ?? [];
            var skillsAnalysis =
                payload?.SkillsAnalysis
                ?? JsonSerializer.Deserialize<Dictionary<string, string>>(file.SkillsAnalysisJson)
                ?? [];

            var downloadUrl = $"/api/saved-files/{file.Id}/resume";

            var jobDescriptionDownloadUrl = await ObjectExistsAsync(
                BuildJobDescriptionObjectKey(file.ObjectKey)
            )
                ? $"/api/saved-files/{file.Id}/job-description"
                : null;

            responses.Add(
                new SavedFileResponse(
                    file.Id,
                    file.OriginalFileName,
                    file.ContentType,
                    file.SizeInBytes,
                    file.CreatedAt,
                    downloadUrl,
                    jobDescriptionDownloadUrl,
                    new SavedFileAiResponse(
                        file.AnalysisStatus,
                        file.MatchScore,
                        file.Feedback,
                        missingKeywords,
                        skillsAnalysis
                    )
                )
            );
        }

        return Result<IReadOnlyList<SavedFileResponse>>.Success(responses);
    }

    public async Task<Result<SavedFileDownloadResponse>> GetResumeFileAsync(
        Guid userId,
        Guid savedFileId,
        CancellationToken ct
    )
    {
        var savedFile = await _context.SavedFiles.FirstOrDefaultAsync(
            file => file.Id == savedFileId && file.UserId == userId,
            ct
        );

        if (savedFile is null)
        {
            return Result.NotFound("File was not found.");
        }

        try
        {
            var objectResponse = await _s3Client.GetObjectAsync(
                new GetObjectRequest { BucketName = _bucketName, Key = savedFile.ObjectKey },
                ct
            );

            await using var responseStream = objectResponse.ResponseStream;
            await using var memoryStream = new MemoryStream();
            await responseStream.CopyToAsync(memoryStream, ct);

            return Result<SavedFileDownloadResponse>.Success(
                new SavedFileDownloadResponse(
                    savedFile.OriginalFileName,
                    savedFile.ContentType,
                    memoryStream.ToArray()
                )
            );
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return Result.NotFound("File attachment was not found.");
        }
    }

    public async Task<Result<string>> GetJobDescriptionTextAsync(
        Guid userId,
        Guid savedFileId,
        CancellationToken ct
    )
    {
        var savedFile = await _context.SavedFiles.FirstOrDefaultAsync(
            file => file.Id == savedFileId && file.UserId == userId,
            ct
        );

        if (savedFile is null)
        {
            return Result.NotFound("File was not found.");
        }

        try
        {
            var objectResponse = await _s3Client.GetObjectAsync(
                new GetObjectRequest
                {
                    BucketName = _bucketName,
                    Key = BuildJobDescriptionObjectKey(savedFile.ObjectKey),
                },
                ct
            );

            await using var responseStream = objectResponse.ResponseStream;
            using var reader = new StreamReader(responseStream);
            var content = await reader.ReadToEndAsync(ct);

            return Result<string>.Success(content);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return Result.NotFound("Job description attachment was not found.");
        }
    }

    private async Task EnsureBucketExistsAsync()
    {
        var bucketExists = await AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _bucketName);

        if (bucketExists)
        {
            return;
        }

        await _s3Client.PutBucketAsync(new PutBucketRequest { BucketName = _bucketName });
    }

    private async Task<SavedAnalysisPayload?> ReadAnalysisPayloadAsync(string fileObjectKey)
    {
        var analysisObjectKey = BuildAnalysisObjectKey(fileObjectKey);

        try
        {
            var response = await _s3Client.GetObjectAsync(_bucketName, analysisObjectKey);
            await using var stream = response.ResponseStream;
            using var reader = new StreamReader(stream);
            var content = await reader.ReadToEndAsync();

            return JsonSerializer.Deserialize<SavedAnalysisPayload>(content);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    private static string BuildAnalysisObjectKey(string fileObjectKey)
    {
        return $"{fileObjectKey}.analysis.json";
    }

    private static string BuildJobDescriptionObjectKey(string fileObjectKey)
    {
        return $"{fileObjectKey}.job-description.txt";
    }

    private async Task<bool> ObjectExistsAsync(string objectKey)
    {
        try
        {
            await _s3Client.GetObjectMetadataAsync(
                new GetObjectMetadataRequest { BucketName = _bucketName, Key = objectKey }
            );
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    private sealed class SavedAnalysisPayload
    {
        public List<string> MissingKeywords { get; set; } = [];
        public Dictionary<string, string> SkillsAnalysis { get; set; } = [];
    }
}
