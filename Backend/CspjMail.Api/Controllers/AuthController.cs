using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using CspjMail.Api.Models;
using CspjMail.Api.DTOs;
using BCrypt.Net;

namespace CspjMail.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly CspjMiniMailDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(CspjMiniMailDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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

            // Mock send email
            Console.WriteLine($"[MOCK EMAIL] Sending 2FA code {code} to {user.Email}");

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
    }
}