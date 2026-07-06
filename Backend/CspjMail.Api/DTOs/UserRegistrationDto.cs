namespace CspjMail.Api.DTOs
{
    public class UserRegistrationDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Nom { get; set; } = null!;
        public string Prenom { get; set; } = null!;
        public string Role { get; set; } = null!;
        public int EntrepriseId { get; set; }
    }
}   