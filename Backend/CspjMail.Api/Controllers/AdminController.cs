using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CspjMail.Api.Models;
using CspjMail.Api.DTOs;
using BCrypt.Net;

namespace CspjMail.Api.Controllers
{
    [Authorize(Roles = "Administrateur")] // Restricts access exclusively to Administrators
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly CspjMiniMailDbContext _context;

        public AdminController(CspjMiniMailDbContext context)
        {
            _context = context;
        }

        // 1. POST: api/admin/users (Create a new platform user)
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            // Check if email is already taken
            var emailExists = await _context.Utilisateurs.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            if (emailExists)
            {
                return BadRequest("A user with this email address already exists.");
            }

            // Verify the selected Enterprise/Association mapping target exists
            var enterpriseExists = await _context.Entreprises.AnyAsync(e => e.Id == dto.EntrepriseId);
            if (!enterpriseExists)
            {
                return BadRequest("The assigned enterprise or association structure does not exist.");
            }

            // Validate that the role matches the specification's nomenclature
            var validRoles = new List<string> { "Administrateur", "Fonctionnaire", "Association" };
            if (!validRoles.Contains(dto.Role))
            {
                return BadRequest("Invalid role. Must be 'Administrateur', 'Fonctionnaire', or 'Association'.");
            }

            var newUser = new Utilisateur
            {
                Email = dto.Email,
                MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(dto.Password), // Encrypted securely
                Nom = dto.Nom,
                Prenom = dto.Prenom,
                Role = dto.Role,
                EntrepriseId = dto.EntrepriseId,
                Actif = true
            };

            _context.Utilisateurs.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { UserId = newUser.Id, Message = $"User account for {dto.Prenom} {dto.Nom} created successfully." });
        }

        // 2. GET: api/admin/stats (Fetch dashboard tracking metrics)
        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            var totalUsers = await _context.Utilisateurs.CountAsync();
            var totalThreads = await _context.Threads.CountAsync();
            var totalMessages = await _context.Messages.CountAsync();

            var stats = new AdminStatsDto
            {
                TotalUsers = totalUsers,
                TotalThreads = totalThreads,
                TotalMessagesSent = totalMessages
            };

            return Ok(stats);
        }
    }
}
