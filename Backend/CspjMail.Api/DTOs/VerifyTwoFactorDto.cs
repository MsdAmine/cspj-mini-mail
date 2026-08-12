using System.ComponentModel.DataAnnotations;

namespace CspjMail.Api.DTOs
{
    public class VerifyTwoFactorDto
    {
        [Required(ErrorMessage = "L'adresse e-mail est obligatoire.")]
        [EmailAddress(ErrorMessage = "Format d'e-mail invalide.")]
        [StringLength(150)]
        public string Email { get; set; } = string.Empty;

        /// <summary>6-digit TOTP code from the user's Authenticator app.</summary>
        [Required(ErrorMessage = "Le code TOTP est obligatoire.")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Le code TOTP doit comporter exactement 6 chiffres.")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Le code TOTP doit être composé de 6 chiffres uniquement.")]
        public string Code { get; set; } = string.Empty;
    }
}
