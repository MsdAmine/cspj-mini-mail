namespace CspjMail.Api.Services
{
    public interface IHtmlSanitizerService
    {
        string SanitizeHtml(string? html);
        string SanitizePlainText(string? text);
    }
}
