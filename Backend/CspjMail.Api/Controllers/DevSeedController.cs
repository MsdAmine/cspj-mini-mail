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
            if (_context.Entreprises.Any() || _context.Utilisateurs.Any())
            {
                return BadRequest("Database already contains seed data.");
            }

            // Create entities matching V2
            var conseil = new Entreprise { Nom = "CSPJ (Conseil)", EstSousTraitant = false };
            var association = new Entreprise { Nom = "Association des Magistrats Marocains", EstSousTraitant = true };

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