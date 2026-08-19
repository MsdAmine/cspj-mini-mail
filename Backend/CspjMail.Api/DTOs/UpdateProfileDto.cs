namespace CspjMail.Api.DTOs
{
    public class UpdateProfileDto
    {
        public string Prenom { get; set; } = null!;
        public string Nom { get; set; } = null!;
        public string Email { get; set; } = null!;

        /// <summary>Optional professional phone number. Null means "leave unchanged".</summary>
        public string? Telephone { get; set; }
    }
}
