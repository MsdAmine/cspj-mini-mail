using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using CspjMail.Api.Configuration;

namespace CspjMail.Api.Services
{
    public class MailKitEmailService : IEmailService
    {
        private readonly SmtpSettings _smtpSettings;
        private readonly ILogger<MailKitEmailService> _logger;

        public MailKitEmailService(IOptions<SmtpSettings> smtpSettings, ILogger<MailKitEmailService> logger)
        {
            _smtpSettings = smtpSettings.Value;
            _logger = logger;
        }

        public async Task SendTwoFactorCodeAsync(string toEmail, string code)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_smtpSettings.SenderName, _smtpSettings.SenderEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = "Code de vérification - CSPJ Mini Mail";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
                            <h2>CSPJ Mini Mail - Sécurité</h2>
                            <p>Bonjour,</p>
                            <p>Votre code de vérification à 6 chiffres est le suivant :</p>
                            <h1 style='color: #2563eb; letter-spacing: 5px; font-size: 32px;'>{code}</h1>
                            <p>Ce code expirera dans 5 minutes.</p>
                            <p>Si vous n'avez pas demandé ce code, veuillez ignorer cet e-mail.</p>
                        </div>"
                };

                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                // Connect using StartTls for security
                await client.ConnectAsync(_smtpSettings.Server, _smtpSettings.Port, SecureSocketOptions.StartTls);
                
                if (!string.IsNullOrEmpty(_smtpSettings.Username))
                {
                    await client.AuthenticateAsync(_smtpSettings.Username, _smtpSettings.Password);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("2FA email sent successfully to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while sending the 2FA email to {Email}", toEmail);
                throw;
            }
        }
    }
}
