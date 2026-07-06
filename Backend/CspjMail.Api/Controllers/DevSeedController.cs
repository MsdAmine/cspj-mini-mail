using Microsoft.AspNetCore.Mvc;
using CspjMail.Api.Models;
using BCrypt.Net;

namespace CspjMail.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevSeedController : ControllerBase
    {
        private readonly CspjMiniMailDbContext _context;

        public DevSeedController(CspjMiniMailDbContext context)
        {
            _context = context;
        }

        [HttpPost("seed")]
        public IActionResult SeedDatabase()
        {
            // Check if data already exists to prevent duplicate seeding
            if (_context.Entreprises.Any() || _context.Utilisateurs.Any())
            {
                return BadRequest("Database already contains seed data.");
            }

            // 1. Create Companies
            var cspj = new Entreprise { Nom = "CSPJ (Interne)", EstSousTraitant = false };
            var subCo = new Entreprise { Nom = "Alpha Tech (Sous-traitant)", EstSousTraitant = true };

            _context.Entreprises.AddRange(cspj, subCo);
            _context.SaveChanges(); // Saves to get IDs

            // 2. Create Users with Hashed Passwords
            var adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
            var employePasswordHash = BCrypt.Net.BCrypt.HashPassword("Employe123!");
            var sousTraitantPasswordHash = BCrypt.Net.BCrypt.HashPassword("Sub123!");

            var admin = new Utilisateur
            {
                Email = "admin@cspj.ma",
                MotDePasseHash = adminPasswordHash,
                Nom = "El Alami",
                Prenom = "Ahmed",
                Role = "Administrateur",
                EntrepriseId = cspj.Id,
                Actif = true
            };

            var employe = new Utilisateur
            {
                Email = "employe@cspj.ma",
                MotDePasseHash = employePasswordHash,
                Nom = "Benjelloun",
                Prenom = "Sanaa",
                Role = "Employe",
                EntrepriseId = cspj.Id,
                Actif = true
            };

            var sousTraitant = new Utilisateur
            {
                Email = "contact@alphatech.ma",
                MotDePasseHash = sousTraitantPasswordHash,
                Nom = "Mansouri",
                Prenom = "Youssef",
                Role = "SousTraitant",
                EntrepriseId = subCo.Id,
                Actif = true
            };

            _context.Utilisateurs.AddRange(admin, employe, sousTraitant);
            _context.SaveChanges();

            return Ok("Database successfully seeded with 2 companies and 3 test users (Passwords: Admin123!, Employe123!, Sub123!).");
        }
    }
}