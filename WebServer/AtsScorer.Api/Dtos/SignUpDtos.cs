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

public record StartSignUpResponse
{
    /// <summary>
    /// The email address for the new account. Must be valid and unique.
    /// </summary>
    [Required]
    [EmailAddress]
    public required string OtpExpiresAt { get; set; }
}

public record VerifyOtpRequest
{
    /// <summary>
    /// The email address for the new account. Must be valid and unique.
    /// </summary>
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    /// <summary>
    /// The 6-digit One-Time Passcode sent to the user's email.
    /// </summary>
    [Required]
    [Length(6, 6, ErrorMessage = "Must be 6 digits")]
    public required string Otp { get; set; }
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
