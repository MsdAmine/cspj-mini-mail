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
using OtpNet;

namespace CspjMail.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly CspjMiniMailDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IWebHostEnvironment _env;

        public AuthController(CspjMiniMailDbContext context, IConfiguration configuration, IEmailService emailService, IWebHostEnvironment env)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _env = env;
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

            // ── TOTP: Branch on whether the user already has a secret ────────────
            if (string.IsNullOrEmpty(user.TwoFactorSecret))
            {
                // First-time setup: generate a 160-bit (20-byte) Base32 secret,
                // persist it, and return it so the user can enrol their Authenticator app.
                var secretBytes = KeyGeneration.GenerateRandomKey(20);
                user.TwoFactorSecret = Base32Encoding.ToString(secretBytes);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    RequiresTwoFactor = true,
                    Email = user.Email,
                    TwoFactorSecret = user.TwoFactorSecret,
                    IsFirstTimeSetup = true
                });
            }

            // Returning user: secret already exists — do NOT expose it again.
            return Ok(new
            {
                RequiresTwoFactor = true,
                Email = user.Email,
                IsFirstTimeSetup = false
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

            if (string.IsNullOrEmpty(user.TwoFactorSecret))
            {
                return Unauthorized("2FA is not set up for this account. Please log in again.");
            }

            // ── TOTP verification via Otp.NET ────────────────────────────────────
            var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);
            var totp = new Totp(secretBytes);

            // VerificationWindow.RfcSpecifiedNetworkDelay allows ±1 time step (±30 s) for clock skew
            bool isValid = totp.VerifyTotp(
                dto.Code ?? string.Empty,
                out _,
                VerificationWindow.RfcSpecifiedNetworkDelay);

            if (!isValid)
            {
                return Unauthorized("Invalid or expired 2FA code.");
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.GivenName, $"{user.Prenom} {user.Nom}"),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("InstitutionId", user.EntrepriseId.ToString())
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

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["DurationInMinutes"] ?? "180"))
            };
            Response.Cookies.Append("cspj_auth_token", tokenString, cookieOptions);

            return Ok(new AuthResponseDto
            {
                Token = string.Empty,
                Email = user.Email,
                Nom = user.Nom,
                Prenom = user.Prenom,
                Role = user.Role
            });
        }


        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("cspj_auth_token", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict
            });
            return Ok(new { message = "Déconnexion réussie." });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var user = await _context.Utilisateurs.FindAsync(userId);
            if (user == null || !user.Actif) return Unauthorized();

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                nom = user.Nom,
                prenom = user.Prenom,
                role = user.Role,
                institutionId = user.EntrepriseId
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
                institutionId = user.EntrepriseId
            });
        }

        // ─── Forgot Password (TOTP flow) ──────────────────────────────────────────
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            // Always return 200 to prevent email enumeration attacks.
            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLower());

            // Confirm the account exists, is active, and already has a TOTP secret
            // enrolled (i.e. the user has scanned the QR code in their Authenticator app).
            if (user == null || !user.Actif || string.IsNullOrEmpty(user.TwoFactorSecret))
            {
                // Return a generic 200 — do not disclose whether the email exists or
                // whether TOTP has been configured.
                return Ok(new { success = true, requiresTotp = false });
            }

            return Ok(new { success = true, requiresTotp = true });
        }

        // ─── Verify TOTP for password reset ───────────────────────────────────────
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLower());

            if (user == null || !user.Actif || string.IsNullOrEmpty(user.TwoFactorSecret))
            {
                return BadRequest(new { error = "رمز التحقق غير صحيح أو منتهي الصلاحية. / Code TOTP invalide ou expiré." });
            }

            // ── Validate the TOTP code using the user's existing Authenticator secret ──
            // This reuses the exact same OtpNet path as the 2FA login flow.
            var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);
            var totp        = new Totp(secretBytes);

            // Allow ±1 time step (±30 s) for clock skew — same tolerance as login.
            bool isValid = totp.VerifyTotp(
                dto.OtpCode?.Trim() ?? string.Empty,
                out _,
                VerificationWindow.RfcSpecifiedNetworkDelay);

            if (!isValid)
            {
                return BadRequest(new { error = "رمز التحقق غير صحيح أو منتهي الصلاحية. / Code TOTP invalide ou expiré." });
            }

            // ── Issue a short-lived (10 min) signed JWT that authorises the reset ────
            var jwtSettings = _configuration.GetSection("Jwt");
            var key         = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

            var claims = new[]
            {
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("purpose", "password_reset")
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject            = new ClaimsIdentity(claims),
                Expires            = DateTime.UtcNow.AddMinutes(10),
                Issuer             = jwtSettings["Issuer"],
                Audience           = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var handler           = new JwtSecurityTokenHandler();
            var resetSessionToken = handler.WriteToken(handler.CreateToken(tokenDescriptor));

            return Ok(new { success = true, resetSessionToken });
        }

        // ─── Reset Password via OTP session token ────────────────────────────────
        [HttpPost("reset-password-otp")]
        public async Task<IActionResult> ResetPasswordOtp([FromBody] ResetPasswordOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.ResetToken) ||
                string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest(new { error = "Tous les champs sont requis." });

            // Validate the reset session token.
            var jwtSettings = _configuration.GetSection("Jwt");
            var key         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));

            var handler = new JwtSecurityTokenHandler();
            ClaimsPrincipal principal;
            try
            {
                principal = handler.ValidateToken(dto.ResetToken, new TokenValidationParameters
                {
                    ValidateIssuer           = true,
                    ValidateAudience         = true,
                    ValidateLifetime         = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer              = jwtSettings["Issuer"],
                    ValidAudience            = jwtSettings["Audience"],
                    IssuerSigningKey         = key,
                    ClockSkew                = TimeSpan.Zero
                }, out _);
            }
            catch
            {
                return BadRequest(new { error = "Le jeton de réinitialisation est invalide ou a expiré." });
            }

            // Ensure the token was issued for this specific email and purpose.
            var tokenEmail   = principal.FindFirstValue(ClaimTypes.Email);
            var tokenPurpose = principal.FindFirstValue("purpose");

            if (!string.Equals(tokenEmail, dto.Email.Trim().ToLower(), StringComparison.OrdinalIgnoreCase) ||
                tokenPurpose != "password_reset")
            {
                return BadRequest(new { error = "Le jeton de réinitialisation est invalide." });
            }

            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLower());

            if (user == null || !user.Actif)
                return BadRequest(new { error = "Compte introuvable." });

            user.MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Votre mot de passe a été réinitialisé avec succès." });
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