namespace CspjMail.Api.DTOs
{
    public class VerifyTwoFactorDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
