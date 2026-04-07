namespace AtsScorer.Api.Dtos;

public record SavedFileAiResponse(
    string Status,
    double MatchScore,
    string Feedback,
    IReadOnlyList<string> MissingKeywords,
    IReadOnlyDictionary<string, string> SkillsAnalysis
);

public record SavedFileResponse(
    Guid Id,
    string FileName,
    string ContentType,
    long SizeInBytes,
    DateTime UploadedAt,
    string DownloadUrl,
    string? JobDescriptionDownloadUrl,
    SavedFileAiResponse AiResponse
);

public record SavedFileDownloadResponse(string FileName, string ContentType, byte[] Content);
