using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using CspjMail.Api.Models;
using BCrypt.Net;

namespace CspjMail.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevSeedController : ControllerBase
    {
        private readonly CspjMiniMailDbContext _context;
        private readonly IWebHostEnvironment _env;

        public DevSeedController(CspjMiniMailDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost("seed")]
        public IActionResult SeedDatabase()
        {
            // Security Fence Check: Hard lock seeding routes from working outside development environments
            if (!_env.IsDevelopment())
            {
                return StatusCode(StatusCodes.Status403Forbidden, "Database seeding endpoints are locked out of non-development deployment targets.");
            }

            if (_context.Entreprises.Any() || _context.Utilisateurs.Any())
            {
                return BadRequest("Database already contains seed data.");
            }

            var conseil = new Entreprise { Nom = "CSPJ (Conseil)", EstAssociation = false };
            var association = new Entreprise { Nom = "Association des Magistrats Marocains", EstAssociation = true };

            _context.Entreprises.AddRange(conseil, association);
            _context.SaveChanges();

            var adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
            var fonctionnairePasswordHash = BCrypt.Net.BCrypt.HashPassword("Fonctionnaire123!");
            var associationPasswordHash = BCrypt.Net.BCrypt.HashPassword("Assoc123!");

            var admin = new Utilisateur
            {
                Email = "admin@cspj.ma",
                MotDePasseHash = adminPasswordHash,
                Nom = "El Alami",
                Prenom = "Ahmed",
                Role = "Administrateur",
                EntrepriseId = conseil.Id,
                Actif = true
            };

            var fonctionnaire = new Utilisateur
            {
                Email = "fonctionnaire@cspj.ma",
                MotDePasseHash = fonctionnairePasswordHash,
                Nom = "Benjelloun",
                Prenom = "Sanaa",
                Role = "Fonctionnaire",
                EntrepriseId = conseil.Id,
                Actif = true
            };

            var assocUser = new Utilisateur
            {
                Email = "contact@association.ma",
                MotDePasseHash = associationPasswordHash,
                Nom = "Mansouri",
                Prenom = "Youssef",
                Role = "Association",
                EntrepriseId = association.Id,
                Actif = true
            };

            _context.Utilisateurs.AddRange(admin, fonctionnaire, assocUser);
            _context.SaveChanges();

            return Ok("Database successfully seeded with new roles: Administrateur, Fonctionnaire, and Association.");
        }
    }
}