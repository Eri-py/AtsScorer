using System.ComponentModel.DataAnnotations.Schema;

namespace AtsScorer.Api.Data.Entities;

public class SavedFileEntity
{
    public Guid Id { get; set; }
    public required string OriginalFileName { get; set; }
    public required string ObjectKey { get; set; }
    public required string ContentType { get; set; }
    public required long SizeInBytes { get; set; }
    public required DateTime CreatedAt { get; set; }
    public required string AnalysisStatus { get; set; }
    public required double MatchScore { get; set; }
    public required string Feedback { get; set; }
    public required string MissingKeywordsJson { get; set; }
    public required string SkillsAnalysisJson { get; set; }

    [ForeignKey("User")]
    public required Guid UserId { get; set; }

    public UserEntity? User { get; set; }
}
