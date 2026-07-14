namespace CspjMail.Api.Services
{
    public interface IEmailService
    {
        Task SendTwoFactorCodeAsync(string toEmail, string code);
        Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    }
}
