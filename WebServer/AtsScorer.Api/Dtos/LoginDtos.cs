using System.ComponentModel.DataAnnotations;

namespace AtsScorer.Api.Dtos;

public record LoginRequest
{
    /// <summary>
    /// The user's email address.
    /// </summary>
    [Required]
    [EmailAddress]
    public required string Identifier { get; set; }

    /// <summary>
    /// The user's password.
    /// </summary>
    [Required]
    public required string Password { get; set; }
}
