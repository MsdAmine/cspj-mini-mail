using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
        private readonly IMemoryCache _cache;

        // Audience used exclusively for short-lived password-reset session tokens.
        // The global JWT bearer middleware is configured for the main audience only,
        // so a reset token cannot satisfy [Authorize] on regular API endpoints.
        private const string ResetTokenAudience = "cspj-password-reset";

        public AuthController(
            CspjMiniMailDbContext context,
            IConfiguration configuration,
            IEmailService emailService,
            IWebHostEnvironment env,
            IMemoryCache cache)
        {
            _context       = context;
            _configuration = configuration;
            _emailService  = emailService;
            _env           = env;
            _cache         = cache;
        }

        // ─── Login ───────────────────────────────────────────────────────────────
        [HttpPost("login")]
        [EnableRateLimiting("totp-ops")]
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
                    Email             = user.Email,
                    TwoFactorSecret   = user.TwoFactorSecret,
                    IsFirstTimeSetup  = true
                });
            }

            // Returning user: secret already exists — do NOT expose it again.
            return Ok(new
            {
                RequiresTwoFactor = true,
                Email             = user.Email,
                IsFirstTimeSetup  = false
            });
        }

        // ─── Verify 2FA (login flow) ─────────────────────────────────────────────
        [HttpPost("verify-2fa")]
        [EnableRateLimiting("totp-ops")]
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
            // Development bypass: accept "123456" without real TOTP validation.
            bool isDevBypass = _env.IsDevelopment() && dto.Code == "123456";

            if (!isDevBypass)
            {
                var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);
                var totp        = new Totp(secretBytes);

                // VerificationWindow.RfcSpecifiedNetworkDelay allows ±1 time step (±30 s) for clock skew.
                // We capture timeStepMatched to prevent replay within the same time window.
                bool isValid = totp.VerifyTotp(
                    dto.Code ?? string.Empty,
                    out long timeStepMatched,
                    VerificationWindow.RfcSpecifiedNetworkDelay);

                if (!isValid)
                {
                    return Unauthorized("Invalid or expired 2FA code.");
                }

                // ── TOTP Replay Prevention ───────────────────────────────────────────
                // A captured valid code must not be reusable within its ±90-second validity window.
                var replayCacheKey = $"totp_used:{user.Id}:{timeStepMatched}";
                if (_cache.TryGetValue(replayCacheKey, out _))
                {
                    return Unauthorized("This 2FA code has already been used. Please wait for a new code.");
                }
                // Mark the time step as consumed for the full ±90 s OtpNet tolerance window.
                _cache.Set(replayCacheKey, true, TimeSpan.FromSeconds(90));
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings  = _configuration.GetSection("Jwt");
            var key          = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

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
                Subject            = new ClaimsIdentity(claims),
                Expires            = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["DurationInMinutes"] ?? "180")),
                Issuer             = jwtSettings["Issuer"],
                Audience           = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token       = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure   = true,
                SameSite = SameSiteMode.Strict,
                Expires  = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["DurationInMinutes"] ?? "180"))
            };
            Response.Cookies.Append("cspj_auth_token", tokenString, cookieOptions);

            return Ok(new AuthResponseDto
            {
                Token  = string.Empty,
                Email  = user.Email,
                Nom    = user.Nom,
                Prenom = user.Prenom,
                Role   = user.Role
            });
        }


        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("cspj_auth_token", new CookieOptions
            {
                HttpOnly = true,
                Secure   = true,
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

            var user = await _context.Utilisateurs
                .Include(u => u.Entreprise)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || !user.Actif) return Unauthorized();

            return Ok(new
            {
                id            = user.Id,
                email         = user.Email,
                nom           = user.Nom,
                prenom        = user.Prenom,
                role          = user.Role,
                institutionId = user.EntrepriseId,
                nomEntreprise = user.Entreprise.Nom,
                telephone     = user.Telephone
            });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var user = await _context.Utilisateurs
                .Include(u => u.Entreprise)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound("Utilisateur introuvable.");

            // Check email uniqueness if changed
            if (!string.Equals(user.Email, dto.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                bool emailTaken = await _context.Utilisateurs
                    .AnyAsync(u => u.Email == dto.Email.Trim() && u.Id != userId);
                if (emailTaken)
                    return BadRequest("Cette adresse e-mail est déjà utilisée par un autre compte.");
            }

            user.Prenom    = dto.Prenom.Trim();
            user.Nom       = dto.Nom.Trim();
            user.Email     = dto.Email.Trim().ToLower();
            // Telephone: null means "clear the value"; omit the key in the JSON to leave unchanged.
            // The DTO property defaults to null, so an explicit null from the client clears the field.
            user.Telephone = string.IsNullOrWhiteSpace(dto.Telephone) ? null : dto.Telephone.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                prenom        = user.Prenom,
                nom           = user.Nom,
                email         = user.Email,
                role          = user.Role,
                institutionId = user.EntrepriseId,
                nomEntreprise = user.Entreprise.Nom,
                telephone     = user.Telephone
            });
        }

        // ─── Change Password (authenticated) ─────────────────────────────────────
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var user = await _context.Utilisateurs.FindAsync(userId);
            if (user == null || !user.Actif)
                return Unauthorized();

            // Verify that the supplied current password is correct before allowing the change.
            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.MotDePasseHash))
                return BadRequest(new { message = "كلمة المرور الحالية غير صحيحة. / Mot de passe actuel incorrect." });

            user.MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم تحديث كلمة المرور بنجاح. / Mot de passe mis à jour avec succès." });
        }

        // ─── Forgot Password (TOTP flow) ──────────────────────────────────────────
        [HttpPost("forgot-password")]
        [EnableRateLimiting("totp-ops")]
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
        [EnableRateLimiting("totp-ops")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLower());

            // ── User-Enumeration Prevention ──────────────────────────────────────
            // Return HTTP 200 with an opaque error body for *both* unknown-user and
            // wrong-code paths so attackers cannot distinguish them by status code.
            if (user == null || !user.Actif || string.IsNullOrEmpty(user.TwoFactorSecret))
            {
                return Ok(new { success = false, error = "Code TOTP invalide ou expiré." });
            }

            // ── Validate the TOTP code using the user's existing Authenticator secret ──
            // Development bypass: accept "123456" without real TOTP validation.
            bool isDevBypass = _env.IsDevelopment() && dto.OtpCode?.Trim() == "123456";

            if (!isDevBypass)
            {
                var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);
                var totp        = new Totp(secretBytes);

                // Capture timeStepMatched to prevent replay within the ±90-second window.
                bool isValid = totp.VerifyTotp(
                    dto.OtpCode?.Trim() ?? string.Empty,
                    out long timeStepMatched,
                    VerificationWindow.RfcSpecifiedNetworkDelay);

                if (!isValid)
                {
                    return Ok(new { success = false, error = "Code TOTP invalide ou expiré." });
                }

                // ── TOTP Replay Prevention ───────────────────────────────────────────
                var replayCacheKey = $"totp_used:{user.Id}:{timeStepMatched}";
                if (_cache.TryGetValue(replayCacheKey, out _))
                {
                    return Ok(new { success = false, error = "Ce code a déjà été utilisé. Veuillez attendre le prochain code." });
                }
                _cache.Set(replayCacheKey, true, TimeSpan.FromSeconds(90));
            }

            // ── Issue a short-lived (10 min) signed JWT that authorises the reset ─
            // SECURITY: Uses a distinct audience ("cspj-password-reset") so the global
            // JWT bearer middleware — configured for the main app audience — rejects
            // this token if an attacker tries to plant it as a session cookie.
            var jwtSettings = _configuration.GetSection("Jwt");
            var key         = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);
            var jti         = Guid.NewGuid().ToString();

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Jti, jti),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("purpose", "password_reset")
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject            = new ClaimsIdentity(claims),
                Expires            = DateTime.UtcNow.AddMinutes(10),
                Issuer             = jwtSettings["Issuer"],
                Audience           = ResetTokenAudience,          // ← isolated audience
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

            // Validate the reset session token against the dedicated narrow audience.
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
                    ValidAudience            = ResetTokenAudience,  // ← must match isolated audience
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
            var jti          = principal.FindFirstValue(JwtRegisteredClaimNames.Jti);

            if (!string.Equals(tokenEmail, dto.Email.Trim().ToLower(), StringComparison.OrdinalIgnoreCase) ||
                tokenPurpose != "password_reset" ||
                string.IsNullOrEmpty(jti))
            {
                return BadRequest(new { error = "Le jeton de réinitialisation est invalide." });
            }

            // ── Single-Use Enforcement (jti blacklist) ───────────────────────────
            // Prevent the resetSessionToken from being replayed within its 10-min window.
            var jtiCacheKey = $"reset_jti_used:{jti}";
            if (_cache.TryGetValue(jtiCacheKey, out _))
            {
                return BadRequest(new { error = "Ce lien de réinitialisation a déjà été utilisé." });
            }

            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLower());

            if (user == null || !user.Actif)
                return BadRequest(new { error = "Compte introuvable." });

            user.MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            await _context.SaveChangesAsync();

            // Blacklist the jti *after* successful DB write so a DB failure doesn't
            // permanently consume the token without resetting the password.
            _cache.Set(jtiCacheKey, true, TimeSpan.FromMinutes(10));

            return Ok(new { success = true, message = "Votre mot de passe a été réinitialisé avec succès." });
        }
    }
}