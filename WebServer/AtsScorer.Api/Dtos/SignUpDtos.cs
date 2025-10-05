using System.ComponentModel.DataAnnotations;

namespace AtsScorer.Api.Dtos;

public record StartSignUpRequest
{
    /// <summary>
    /// The email address for the new account. Must be valid and unique.
    /// </summary>
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}

public record CompleteSignUpRequest
{
    /// <summary>
    /// The email address for the new account.
    /// </summary>
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    /// <summary>
    /// The password for the new account.
    /// </summary>
    [Required]
    public required string Password { get; set; }
}
