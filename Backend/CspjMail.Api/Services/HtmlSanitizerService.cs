using System.Text.RegularExpressions;
using Ganss.Xss;

namespace CspjMail.Api.Services
{
    public class HtmlSanitizerService : IHtmlSanitizerService
    {
        private readonly HtmlSanitizer _sanitizer;
        private static readonly Regex HtmlTagRegex = new("<.*?>", RegexOptions.Compiled);

        public HtmlSanitizerService()
        {
            _sanitizer = new HtmlSanitizer();

            // Configure allowed schemes for URLs (links & images)
            _sanitizer.AllowedSchemes.Add("http");
            _sanitizer.AllowedSchemes.Add("https");
            _sanitizer.AllowedSchemes.Add("mailto");
            _sanitizer.AllowedSchemes.Add("data"); // For safe data-URI preview images if needed

            // Configure allowed attributes
            _sanitizer.AllowedAttributes.Add("class");
            _sanitizer.AllowedAttributes.Add("style");
            _sanitizer.AllowedAttributes.Add("target");
            _sanitizer.AllowedAttributes.Add("rel");
        }

        public string SanitizeHtml(string? html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return string.Empty;

            return _sanitizer.Sanitize(html);
        }

        public string SanitizePlainText(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            // Strip any HTML tags from plain text fields to prevent injection
            var stripped = HtmlTagRegex.Replace(text, string.Empty);
            return stripped.Trim();
        }
    }
}
