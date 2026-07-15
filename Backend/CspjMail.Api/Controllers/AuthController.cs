using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using CspjMail.Api.Models;
using CspjMail.Api.DTOs;
using CspjMail.Api.Services;
using BCrypt.Net;

namespace CspjMail.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly CspjMiniMailDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthController(CspjMiniMailDbContext context, IConfiguration configuration, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var user = await _context.Utilisateurs
                .Include(u => u.Entreprise)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !user.Actif)
            {
                return Unauthorized("Invalid email or account is inactive.");
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.MotDePasseHash);
            if (!isPasswordValid)
            {
                return Unauthorized("Invalid password.");
            }

            // Generate 2FA Code
            var code = new Random().Next(100000, 999999).ToString();
            user.TwoFactorCode = code;
            user.TwoFactorExpiry = DateTime.UtcNow.AddMinutes(5);
            await _context.SaveChangesAsync();

            // Send real email via MailKit
            await _emailService.SendTwoFactorCodeAsync(user.Email, code);

            return Ok(new
            {
                RequiresTwoFactor = true,
                Email = user.Email
            });
        }

        [HttpPost("verify-2fa")]
        public async Task<IActionResult> VerifyTwoFactor([FromBody] VerifyTwoFactorDto dto)
        {
            var user = await _context.Utilisateurs
                .Include(u => u.Entreprise)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !user.Actif)
            {
                return Unauthorized("Invalid email or account is inactive.");
            }

            if (user.TwoFactorCode != dto.Code || user.TwoFactorExpiry < DateTime.UtcNow)
            {
                return Unauthorized("Invalid or expired 2FA code.");
            }

            // Clear 2FA
            user.TwoFactorCode = null;
            user.TwoFactorExpiry = null;
            await _context.SaveChangesAsync();

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.GivenName, $"{user.Prenom} {user.Nom}"),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("EntrepriseId", user.EntrepriseId.ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["DurationInMinutes"] ?? "180")),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new AuthResponseDto
            {
                Token = tokenString,
                Email = user.Email,
                Nom = user.Nom,
                Prenom = user.Prenom,
                Role = user.Role
            });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var user = await _context.Utilisateurs.FindAsync(userId);
            if (user == null) return NotFound("Utilisateur introuvable.");

            // Check email uniqueness if changed
            if (!string.Equals(user.Email, dto.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                bool emailTaken = await _context.Utilisateurs
                    .AnyAsync(u => u.Email == dto.Email.Trim() && u.Id != userId);
                if (emailTaken)
                    return BadRequest("Cette adresse e-mail est déjà utilisée par un autre compte.");
            }

            user.Prenom = dto.Prenom.Trim();
            user.Nom = dto.Nom.Trim();
            user.Email = dto.Email.Trim().ToLower();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                prenom = user.Prenom,
                nom = user.Nom,
                email = user.Email,
                role = user.Role,
                entrepriseId = user.EntrepriseId
            });
        }

        // ─── Forgot Password ──────────────────────────────────────────────────────
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            // Always return 200 to prevent email enumeration attacks.
            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLower());

            if (user == null || !user.Actif)
                return Ok(new { message = "If an account exists with this email, a password reset link has been sent." });

            // Generate a cryptographically secure token
            var tokenBytes = new byte[32];
            System.Security.Cryptography.RandomNumberGenerator.Fill(tokenBytes);
            var token = Convert.ToBase64String(tokenBytes)
                .Replace("+", "-").Replace("/", "_").Replace("=", ""); // URL-safe

            user.PasswordResetToken = token;
            user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);
            await _context.SaveChangesAsync();

            var resetLink = $"http://localhost:5173/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";

            var htmlBody = $@"
<!DOCTYPE html>
<html lang=""fr"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0""/>
  <title>Réinitialisation du mot de passe</title>
</head>
<body style=""margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#0f172a;padding:40px 0;"">
    <tr>
      <td align=""center"">
        <table width=""560"" cellpadding=""0"" cellspacing=""0""
               style=""background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;"">

          <!-- Header -->
          <tr>
            <td style=""background:linear-gradient(135deg,#1d4ed8 0%,#4f46e5 100%);
                        padding:32px 40px;text-align:center;"">
              <div style=""display:inline-block;background:rgba(255,255,255,0.15);
                           border-radius:50%;padding:12px;margin-bottom:12px;"">
                <img src=""https://img.icons8.com/fluency/48/000000/lock.png""
                     width=""40"" height=""40"" alt=""Lock"" style=""display:block;""/>
              </div>
              <h1 style=""margin:0;color:#ffffff;font-size:22px;font-weight:700;
                          letter-spacing:-0.5px;"">CSPJ Mini Mail</h1>
              <p style=""margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;"">
                Plateforme de messagerie interne professionnelle
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style=""padding:36px 40px;"">
              <h2 style=""margin:0 0 16px;color:#f1f5f9;font-size:18px;font-weight:600;"">
                Réinitialisation de votre mot de passe
              </h2>
              <p style=""margin:0 0 16px;color:#94a3b8;font-size:14px;line-height:1.7;"">
                Bonjour <strong style=""color:#e2e8f0;"">{user.Prenom} {user.Nom}</strong>,
              </p>
              <p style=""margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.7;"">
                Nous avons reçu une demande de réinitialisation du mot de passe associé
                à votre compte. Cliquez sur le bouton ci-dessous pour choisir un nouveau
                mot de passe. Ce lien est valable pendant <strong style=""color:#e2e8f0;"">15 minutes</strong>.
              </p>

              <!-- CTA Button -->
              <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
                <tr>
                  <td align=""center"">
                    <a href=""{resetLink}""
                       style=""display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);
                               color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;
                               padding:14px 36px;border-radius:10px;
                               box-shadow:0 4px 14px rgba(37,99,235,0.45);"">
                      Réinitialiser mon mot de passe →
                    </a>
                  </td>
                </tr>
              </table>

              <p style=""margin:28px 0 0;color:#64748b;font-size:12px;line-height:1.7;"">
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail —
                votre mot de passe restera inchangé.<br/><br/>
                En cas de problème avec le bouton, copiez ce lien dans votre navigateur :<br/>
                <a href=""{resetLink}"" style=""color:#3b82f6;word-break:break-all;"">{resetLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style=""padding:20px 40px;border-top:1px solid #334155;text-align:center;"">
              <p style=""margin:0;color:#475569;font-size:11px;"">
                © {DateTime.UtcNow.Year} CSPJ Mini Mail · Ce message est automatique, merci de ne pas y répondre.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

            try
            {
                await _emailService.SendEmailAsync(
                    user.Email,
                    "Réinitialisation de votre mot de passe — CSPJ Mini Mail",
                    htmlBody);
            }
            catch (Exception ex)
            {
                // Log but do not expose errors to the caller
                Console.Error.WriteLine($"Failed to send reset email: {ex.Message}");
            }

            return Ok(new { message = "If an account exists with this email, a password reset link has been sent." });
        }

        // ─── Reset Password ───────────────────────────────────────────────────────
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Token) ||
                string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest("Tous les champs sont requis.");

            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLower());

            if (user == null ||
                user.PasswordResetToken != dto.Token ||
                user.ResetTokenExpiry == null ||
                user.ResetTokenExpiry < DateTime.UtcNow)
            {
                return BadRequest("Le lien de réinitialisation est invalide ou a expiré.");
            }

            // Hash the new password using the same BCrypt mechanism as registration
            user.MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            // Invalidate the token immediately after use
            user.PasswordResetToken = null;
            user.ResetTokenExpiry = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Votre mot de passe a été réinitialisé avec succès." });
        }
    }
}