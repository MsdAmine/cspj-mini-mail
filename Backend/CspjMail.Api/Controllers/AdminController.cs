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

        // 3. GET: api/admin/users (Fetch all registered system users)
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Utilisateurs
                .Include(u => u.Entreprise)
                .OrderByDescending(u => u.DateCreation)
                .Select(u => new UserDetailsDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Nom = u.Nom,
                    Prenom = u.Prenom,
                    Role = u.Role,
                    EntrepriseId = u.EntrepriseId,
                    EntrepriseNom = u.Entreprise.Nom,
                    Actif = u.Actif,
                    DateCreation = u.DateCreation
                })
                .ToListAsync();

            return Ok(users);
        }

        // 3.5 GET: api/admin/threads (Fetch recent discussions for dashboard)
        [HttpGet("threads")]
        public async Task<IActionResult> GetThreads()
        {
            var threads = await _context.Threads
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Expediteur)
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Destinataire)
                .Include(t => t.Messages)
                    .ThenInclude(m => m.PiecesJointes)
                .OrderByDescending(t => t.DateCreation)
                .Take(50)
                .ToListAsync();

            var result = threads.Select(t => {
                var firstMessage = t.Messages.OrderBy(m => m.DateEnvoi).FirstOrDefault();
                var lastMessage = t.Messages.OrderByDescending(m => m.DateEnvoi).FirstOrDefault();
                var hasAttachment = t.Messages.Any(m => m.PiecesJointes.Any());
                var attachmentName = t.Messages.SelectMany(m => m.PiecesJointes).Select(p => p.NomFichier).FirstOrDefault() ?? string.Empty;
                
                return new AdminThreadDto
                {
                    Id = t.Id,
                    Objet = t.Objet,
                    Expediteur = firstMessage != null ? $"{firstMessage.Expediteur.Prenom} {firstMessage.Expediteur.Nom}" : "Inconnu",
                    ExpediteurEmail = firstMessage?.Expediteur?.Email ?? "inconnu@cspj.ma",
                    Destinataire = firstMessage != null ? $"{firstMessage.Destinataire.Prenom} {firstMessage.Destinataire.Nom}" : "Inconnu",
                    DestinataireEmail = firstMessage?.Destinataire?.Email ?? "inconnu@cspj.ma",
                    Date = t.DateCreation,
                    StatutLecture = lastMessage?.EstLu == true ? "Lu" : "Non lu",
                    StatutAcheminement = t.EstArchive ? "Clôturé" : "En cours",
                    HasAttachment = hasAttachment,
                    PieceJointeNom = attachmentName
                };
            }).ToList();

            return Ok(result);
        }

        // 3.6 GET: api/admin/audit-logs (Fetch audit logs)
        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .OrderByDescending(a => a.DateHeure)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    DateHeure = a.DateHeure,
                    TypeAction = a.TypeAction,
                    Utilisateur = a.Utilisateur,
                    Description = a.Description
                })
                .ToListAsync();

            return Ok(logs);
        }

        // 3.7 POST: api/admin/audit-logs (Persist a new audit log entry from the frontend)
        [HttpPost("audit-logs")]
        public async Task<IActionResult> CreateAuditLog([FromBody] AuditLogDto dto)
        {
            var entry = new AuditLog
            {
                DateHeure = DateTime.Now,
                TypeAction = dto.TypeAction,
                Utilisateur = dto.Utilisateur,
                Description = dto.Description
            };

            _context.AuditLogs.Add(entry);
            await _context.SaveChangesAsync();

            return Ok(new { entry.Id, entry.DateHeure });
        }

        // 4. PUT: api/admin/users/{id}/status (Modify active status of a user)
        [HttpPut("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto dto)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.Actif = dto.Actif;
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"User status updated successfully to {(user.Actif ? "Active" : "Inactive")}." });
        }

        // 5. DELETE: api/admin/users/{id} (Securely delete user and their associated data)
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Optional safety: Prevent admin from deleting themselves
            var currentUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (currentUserIdClaim != null && int.TryParse(currentUserIdClaim, out int currentUserId) && currentUserId == id)
            {
                return BadRequest("You cannot delete your own administrator account.");
            }

            // Begin transaction to ensure atomic deletion of all relational data
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // 1. Find all messages where this user is sender or recipient
                    var relatedMessages = await _context.Messages
                        .Where(m => m.ExpediteurId == id || m.DestinataireId == id)
                        .ToListAsync();

                    var messageIds = relatedMessages.Select(m => m.Id).ToList();

                    // 2. Remove all attachments for these messages
                    if (messageIds.Any())
                    {
                        var attachments = await _context.PiecesJointes
                            .Where(pj => messageIds.Contains(pj.MessageId))
                            .ToListAsync();
                        _context.PiecesJointes.RemoveRange(attachments);
                    }

                    // 3. Remove all these messages
                    _context.Messages.RemoveRange(relatedMessages);
                    await _context.SaveChangesAsync();

                    // 4. Clean up any threads that now have no messages left
                    var threadIds = relatedMessages.Select(m => m.ThreadId).Distinct().ToList();
                    foreach (var threadId in threadIds)
                    {
                        var hasMessages = await _context.Messages.AnyAsync(m => m.ThreadId == threadId);
                        if (!hasMessages)
                        {
                            var thread = await _context.Threads.FindAsync(threadId);
                            if (thread != null)
                            {
                                _context.Threads.Remove(thread);
                            }
                        }
                    }
                    await _context.SaveChangesAsync();

                    // 5. Finally, remove the user
                    _context.Utilisateurs.Remove(user);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();
                    return Ok(new { Message = "User and all associated messages/data deleted successfully." });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(StatusCodes.Status500InternalServerError, $"An error occurred during deletion: {ex.Message}");
                }
            }
        }
    }
}
