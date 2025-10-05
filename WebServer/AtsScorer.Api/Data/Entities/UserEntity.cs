namespace AtsScorer.Api.Data.Entities;

public record class UserEntity
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public DateTime? CreatedAt { get; set; }

    // Navigation properties
    public ICollection<RefreshTokenEntity> RefreshTokens { get; set; } = [];
}
