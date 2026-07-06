using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
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
            // 1. Find user by email
            var user = await _context.Utilisateurs
                .Include(u => u.Entreprise)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !user.Actif)
            {
                return Unauthorized("Invalid email or account is inactive.");
            }

            // 2. Verify password hash
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.MotDePasseHash);
            if (!isPasswordValid)
            {
                return Unauthorized("Invalid password.");
            }

            // 3. Generate JWT Token
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.GivenName, $"{user.Prenom} {user.Nom}"),
                new Claim(ClaimTypes.Role, user.Role), // 'Administrateur', 'Employe', 'SousTraitant'
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

            // 4. Return user details and token
            return Ok(new AuthResponseDto
            {
                Token = tokenString,
                Email = user.Email,
                Nom = user.Nom,
                Prenom = user.Prenom,
                Role = user.Role
            });
        }
    }
}