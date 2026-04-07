namespace AtsScorer.Api.Dtos;

public record UserDto
{
    public required string Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string? Firstname { get; set; }
    public string? Lastname { get; set; }
}

public record GetUserResponse
{
    public required bool IsAuthenticated { get; set; }
    public UserDto? User { get; set; }
}
