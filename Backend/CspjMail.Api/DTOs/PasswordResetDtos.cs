using System.ComponentModel.DataAnnotations;

namespace CspjMail.Api.DTOs
{
    public class ForgotPasswordDto
    {
        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = null!;
    }


    // ── OTP flow ──────────────────────────────────────────────────────────────

    /// <summary>Step 2 — validate the 6-digit OTP sent to the user.</summary>
    public class VerifyOtpDto
    {
        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = null!;

        [Required]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Le code OTP doit comporter exactement 6 chiffres.")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Le code OTP doit être composé de 6 chiffres uniquement.")]
        public string OtpCode { get; set; } = null!;
    }

    /// <summary>Step 3 — set a new password using the short-lived reset session token.</summary>
    public class ResetPasswordOtpDto
    {
        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = null!;

        [Required]
        public string ResetToken { get; set; } = null!;

        [Required]
        [StringLength(128, MinimumLength = 8, ErrorMessage = "Le mot de passe doit contenir au moins 8 caractères.")]
        [RegularExpression(
            @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$",
            ErrorMessage = "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.")]
        public string NewPassword { get; set; } = null!;
    }

    // ── Authenticated change-password flow ────────────────────────────────────

    /// <summary>Authenticated user changing their own password.</summary>
    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = null!;

        [Required]
        [StringLength(128, MinimumLength = 1)]
        public string NewPassword { get; set; } = null!;
    }
}
