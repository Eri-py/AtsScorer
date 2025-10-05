using System.ComponentModel.DataAnnotations;

namespace AtsScorer.Api.Dtos;

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

public record ResendOtpRequest
{
    /// <summary>
    /// The email address for the new account. Must be valid and unique.
    /// </summary>
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}

public record OtpResponse
{
    /// <summary>
    /// The email address for the new account. Must be valid and unique.
    /// </summary>
    [Required]
    [EmailAddress]
    public required DateTime OtpExpiresAt { get; set; }
}
