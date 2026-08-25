using System;
using System.Text.RegularExpressions;
using System.Net;

namespace CspjMail.Api.Services
{
    public class HtmlSanitizerService : IHtmlSanitizerService
    {
        // Matches dangerous tags like <script>...</script>, <iframe>...</iframe>, <object>, <embed>, <applet>, <meta>, <link>, etc.
        private static readonly Regex DangerousTagsRegex = new(
            @"<(script|iframe|object|embed|applet|meta|link|style|base|form|svg)[\s\S]*?(\/>|<\/\1>)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private static readonly Regex StandaloneDangerousTagsRegex = new(
            @"<\/?(script|iframe|object|embed|applet|meta|link|style|base|form|svg)[^>]*>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // Matches inline event handlers like onclick=, onerror=, onload=, onmouseover=, etc.
        private static readonly Regex EventAttributesRegex = new(
            @"\s+on\w+\s*=\s*("".*?""|'.*?'|[^\s>]+)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // Matches dangerous pseudo-protocols like href="javascript:..." or src="javascript:..."
        private static readonly Regex JavaScriptProtocolRegex = new(
            @"(href|src|action)\s*=\s*[""']\s*(javascript|vbscript|data):[^""']*[""']",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        // Matches any HTML tag (for plain text stripping)
        private static readonly Regex HtmlTagRegex = new(
            @"<[^>]+>",
            RegexOptions.Compiled);

        public string SanitizeHtml(string? html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return string.Empty;

            var sanitized = DangerousTagsRegex.Replace(html, string.Empty);
            sanitized = StandaloneDangerousTagsRegex.Replace(sanitized, string.Empty);
            sanitized = EventAttributesRegex.Replace(sanitized, string.Empty);
            sanitized = JavaScriptProtocolRegex.Replace(sanitized, string.Empty);

            return sanitized.Trim();
        }

        public string SanitizePlainText(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            var stripped = HtmlTagRegex.Replace(text, string.Empty);
            return WebUtility.HtmlDecode(stripped).Trim();
        }
    }
}
