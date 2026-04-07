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
        AnalyseResumeResponse analysisResponse
    )
    {
        if (file.Length == 0)
        {
            return Result.BadRequest("File is empty.");
        }

        var fileExtension = Path.GetExtension(fileName);
        var objectKey = $"users/{userId}/files/{Guid.NewGuid()}{fileExtension}";
        var analysisObjectKey = BuildAnalysisObjectKey(objectKey);

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
                "Failed to save file for user {UserId}. Bucket: {BucketName}, ObjectKey: {ObjectKey}, AnalysisKey: {AnalysisObjectKey}",
                userId,
                _bucketName,
                objectKey,
                analysisObjectKey
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
                ?? new Dictionary<string, string>();

            var downloadUrl = _s3Client.GetPreSignedURL(
                new GetPreSignedUrlRequest
                {
                    BucketName = _bucketName,
                    Key = file.ObjectKey,
                    Expires = DateTime.UtcNow.AddMinutes(15),
                }
            );

            responses.Add(
                new SavedFileResponse(
                    file.Id,
                    file.OriginalFileName,
                    file.ContentType,
                    file.SizeInBytes,
                    file.CreatedAt,
                    downloadUrl,
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

    private sealed class SavedAnalysisPayload
    {
        public List<string> MissingKeywords { get; set; } = [];
        public Dictionary<string, string> SkillsAnalysis { get; set; } = [];
    }
}
